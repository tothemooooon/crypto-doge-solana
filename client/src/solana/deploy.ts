import { AccountLayout, Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
  Connection,
  Keypair,
  ParsedAccountData,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import BN from "bn.js";
import {
  CRYPTO_DOGE_PROGRAM_ID,
  CRYPTO_DOGE_TOTAL_NUM,
  ENV,
  ROOT_ACCOUNT_PRIVATE_KEY,
  ROOT_WSOL_ACCOUNT_PUBKEY,
} from "../constants";
import { SALE_ACCOUNT_DATA_LAYOUT, SaleLayout } from "../utils/data-layout";

const fs = require("fs");
const path = require("path");
const { promisify } = require("util");
const exec = promisify(require("child_process").exec);

const connection = new Connection(ENV.Devnet.endpoint, "singleGossip");
const baseUrl = "https://cryptodoge.s3.ap-northeast-2.amazonaws.com/doges";
// ipfs baseUrl: "https://gateway.pinata.cloud/ipfs/Qmd3Jy88afaqByGw32EqJMqaM1y5En5Ui6NzVTziqo3uWG/doges";

export const initSale = async (
  initializerAccount: Keypair,
  initializerNftTokenAccountPubkey: PublicKey,
  amountNftTokenToSendToSale: number,
  initializerReceivingTokenAccountPubkeyString: string,
  expectedAmount: number,
  saleProgramIdString: string
) => {
  const parsedNftAccountInfo = await connection.getParsedAccountInfo(
    initializerNftTokenAccountPubkey,
    "singleGossip"
  );
  const nftAccountInfo = (parsedNftAccountInfo.value!.data as ParsedAccountData)
    .parsed.info;
  const nftMint = nftAccountInfo.mint;

  const nftTokenMintAccountPubkey = new PublicKey(nftMint);

  const tempTokenAccount = Keypair.generate();
  const createTempNftTokenAccountIx = SystemProgram.createAccount({
    programId: TOKEN_PROGRAM_ID,
    space: AccountLayout.span,
    lamports: await connection.getMinimumBalanceForRentExemption(
      AccountLayout.span,
      "singleGossip"
    ),
    fromPubkey: initializerAccount.publicKey,
    newAccountPubkey: tempTokenAccount.publicKey,
  });
  const initTempAccountIx = Token.createInitAccountInstruction(
    TOKEN_PROGRAM_ID,
    nftTokenMintAccountPubkey,
    tempTokenAccount.publicKey,
    initializerAccount.publicKey
  );
  const transferNftTokensToTempAccIx = Token.createTransferInstruction(
    TOKEN_PROGRAM_ID,
    initializerNftTokenAccountPubkey,
    tempTokenAccount.publicKey,
    initializerAccount.publicKey,
    [],
    amountNftTokenToSendToSale
  );

  const saleAccount = Keypair.generate();
  const saleProgramId = new PublicKey(saleProgramIdString);

  const createSaleAccountIx = SystemProgram.createAccount({
    space: SALE_ACCOUNT_DATA_LAYOUT.span,
    lamports: await connection.getMinimumBalanceForRentExemption(
      SALE_ACCOUNT_DATA_LAYOUT.span,
      "singleGossip"
    ),
    fromPubkey: initializerAccount.publicKey,
    newAccountPubkey: saleAccount.publicKey,
    programId: saleProgramId,
  });

  const initializerTokenAccountPubkey = new PublicKey(
    initializerReceivingTokenAccountPubkeyString
  );

  const parsedTokenAccountInfo = await connection.getParsedAccountInfo(
    initializerTokenAccountPubkey,
    "singleGossip"
  );
  const tokenAccountInfo = (
    parsedTokenAccountInfo.value!.data as ParsedAccountData
  ).parsed.info;
  const tokenDecimals = tokenAccountInfo.tokenAmount.decimals || 0;

  const expectedAmountInTokenDecimals =
    expectedAmount * Math.pow(10, tokenDecimals || 0);

  const initSaleIx = new TransactionInstruction({
    programId: saleProgramId,
    keys: [
      {
        pubkey: initializerAccount.publicKey,
        isSigner: true,
        isWritable: false,
      },
      { pubkey: tempTokenAccount.publicKey, isSigner: false, isWritable: true },
      {
        pubkey: new PublicKey(initializerReceivingTokenAccountPubkeyString),
        isSigner: false,
        isWritable: false,
      },
      { pubkey: saleAccount.publicKey, isSigner: false, isWritable: true },
      { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    data: Buffer.from(
      Uint8Array.of(
        0,
        ...new BN(expectedAmountInTokenDecimals).toArray("le", 8)
      )
    ),
  });

  const tx = new Transaction().add(
    createTempNftTokenAccountIx,
    initTempAccountIx,
    transferNftTokensToTempAccIx,
    createSaleAccountIx,
    initSaleIx
  );

  const txid = await connection.sendTransaction(
    tx,
    [initializerAccount, tempTokenAccount, saleAccount],
    { skipPreflight: false, preflightCommitment: "singleGossip" }
  );

  await new Promise((resolve) => setTimeout(resolve, 1000));
  await connection.confirmTransaction(txid);

  const encodedSaleState = (await connection.getAccountInfo(
    saleAccount.publicKey,
    "singleGossip"
  ))!.data;

  const decodedSaleState = SALE_ACCOUNT_DATA_LAYOUT.decode(
    encodedSaleState
  ) as SaleLayout;

  return {
    saleAccountPubkey: saleAccount.publicKey.toBase58(),
    isInitialized: !!decodedSaleState.isInitialized,
    initializerAccountPubkey: new PublicKey(
      decodedSaleState.initializerPubkey
    ).toBase58(),
    nftTokenTempAccountPubkey: new PublicKey(
      decodedSaleState.initializerTempNftTokenAccountPubkey
    ).toBase58(),
    initializerTokenAccount: new PublicKey(
      decodedSaleState.initializerReceivingTokenAccountPubkey
    ).toBase58(),
    expectedAmount: new BN(
      decodedSaleState.expectedAmount,
      10,
      "le"
    ).toNumber(),
  };
};

(async () => {
  const privateKeyByteArray = ROOT_ACCOUNT_PRIVATE_KEY;
  const rootWSOLAccountPubkeyString = ROOT_WSOL_ACCOUNT_PUBKEY;
  const rootAccount = Keypair.fromSecretKey(
    Uint8Array.from(privateKeyByteArray)
  );

  let nftIdx: any = [];

  for (let i = 0; i < CRYPTO_DOGE_TOTAL_NUM; i++) {
    const tokenOut = await exec("spl-token create-token --decimals 0");
    const mintAddress = tokenOut.stdout.trim().split(" ")[2].split("\n")[0];

    let tx = new Transaction();
    const nftMintPubkey = new PublicKey(mintAddress);
    const newNftAccount = Keypair.generate();
    const balanceNeeded = await connection.getMinimumBalanceForRentExemption(
      AccountLayout.span,
      "singleGossip"
    );
    const createNewNftAccount = SystemProgram.createAccount({
      fromPubkey: rootAccount.publicKey,
      newAccountPubkey: newNftAccount.publicKey,
      lamports: balanceNeeded,
      space: AccountLayout.span,
      programId: TOKEN_PROGRAM_ID,
    });

    tx.add(createNewNftAccount);

    tx.add(
      Token.createInitAccountInstruction(
        TOKEN_PROGRAM_ID,
        nftMintPubkey,
        newNftAccount.publicKey,
        rootAccount.publicKey
      )
    );

    tx.add(
      Token.createMintToInstruction(
        TOKEN_PROGRAM_ID,
        nftMintPubkey,
        newNftAccount.publicKey,
        rootAccount.publicKey,
        [],
        1
      )
    );

    console.log("rootaccount: ", rootAccount.publicKey.toBase58());

    const txid = await connection.sendTransaction(
      tx,
      [rootAccount, newNftAccount],
      { skipPreflight: false, preflightCommitment: "singleGossip" }
    );
    await connection.confirmTransaction(txid, "singleGossip");

    const initializerNftTokenAccountPubkey = newNftAccount.publicKey;
    const amountNftTokenToSendToSale = 1;
    const initializerReceivingTokenAccountPubkeyString =
      rootWSOLAccountPubkeyString;
    const expectedAmount = 0.1;
    const out = await initSale(
      rootAccount,
      initializerNftTokenAccountPubkey,
      amountNftTokenToSendToSale,
      initializerReceivingTokenAccountPubkeyString,
      expectedAmount,
      CRYPTO_DOGE_PROGRAM_ID
    );
    console.log(out);

    nftIdx.push({
      mintAddress,
      tokenURI: `${baseUrl}/doge-${i}.png`,
      saleProgramId: out.saleAccountPubkey,
      price: expectedAmount,
    });
  }

  const jsonString = JSON.stringify(nftIdx, undefined, 2);
  const outputDir = path.resolve(__dirname, "./nftindex");
  fs.mkdir(outputDir, { recursive: true }, (err: any) => {
    if (err) throw err;
  });

  fs.writeFile(
    path.join(outputDir, `./nft-index.json`),
    jsonString,
    (err: any) => {
      if (err) {
        console.log("Error writing file", err);
      } else {
        console.log("Write file success");
      }
    }
  );
})();
