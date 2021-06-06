import { NATIVE_MINT } from "@solana/spl-token";
import { AccountLayout, Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";
import BN from "bn.js";
import Image from "next/image";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useToasts } from "react-toast-notifications";
import Layout from "../../components/layout";
import { CRYPTO_DOGE_PROGRAM_ID } from "../../constants";
import { sendTransaction, useConnection } from "../../contexts/connection";
import { useWallet } from "../../contexts/wallet";
import { useUserAccounts } from "../../hooks/useUserAccounts";
import nftIndex from "../../solana/nftIndex";
import { SaleLayout, SALE_ACCOUNT_DATA_LAYOUT } from "../../utils/data-layout";
import { shortenAddress } from "../../utils/format";

const DogePage = () => {
  const router = useRouter();
  const { addToast } = useToasts();
  const { pid, s: saleAccountKey } = router.query;
  const connection = useConnection();
  const { wallet, publicKey } = useWallet();
  const [loading, setLoading] = useState(false);
  const { userAccounts } = useUserAccounts();
  const [soldOut, setSoldOut] = useState(true);
  const [encodedSaleState, setEncodedSaleState] = useState<Buffer>();

  const checkSoldOut = async () => {
    try {
      const enc = (await connection.getAccountInfo(
        new PublicKey(saleAccountKey as string),
        "singleGossip"
      ))!.data;
      setEncodedSaleState(enc);
      setSoldOut(false);
    } catch (err) {
      setSoldOut(true);
      console.log("sold out or Could not find sale at given address");
    }
  };

  useEffect(() => {
    checkSoldOut();
  }, []);

  const buyDoge = async () => {
    setLoading(true);
    if (publicKey && wallet) {
      const buyerAccountPubkey = publicKey;
      const saleAccountPubkey = new PublicKey(saleAccountKey as string);

      let buyerTokenAccountPubkey: PublicKey;
      let buyerNftAccountPubkey: PublicKey;
      const nftMintPubkey = new PublicKey(pid as string);
      const programId = new PublicKey(CRYPTO_DOGE_PROGRAM_ID);
      const expectedNftAmount = 1;

      const decodedSaleLayout = SALE_ACCOUNT_DATA_LAYOUT.decode(
        encodedSaleState
      ) as SaleLayout;

      const saleState = {
        saleAccountPubkey: saleAccountPubkey,
        isInitialized: !!decodedSaleLayout.isInitialized,
        initializerAccountPubkey: new PublicKey(
          decodedSaleLayout.initializerPubkey
        ),
        nftTokenTempAccountPubkey: new PublicKey(
          decodedSaleLayout.initializerTempNftTokenAccountPubkey
        ),
        initializerTokenAccount: new PublicKey(
          decodedSaleLayout.initializerReceivingTokenAccountPubkey
        ),
        expectedAmount: new BN(decodedSaleLayout.expectedAmount, 10, "le"),
      };

      const PDA = await PublicKey.findProgramAddress(
        [Buffer.from("sale")],
        programId
      );

      let instructions: TransactionInstruction[] = [];

      const newWSOLAccount = Keypair.generate();
      const balanceNeeded = await connection.getMinimumBalanceForRentExemption(
        AccountLayout.span,
        "singleGossip"
      );
      const createNewAccount = SystemProgram.createAccount({
        fromPubkey: publicKey,
        newAccountPubkey: newWSOLAccount.publicKey,
        lamports: balanceNeeded,
        space: AccountLayout.span,
        programId: TOKEN_PROGRAM_ID,
      });

      instructions.push(createNewAccount);
      instructions.push(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: newWSOLAccount.publicKey,
          lamports: saleState.expectedAmount.toNumber(),
        })
      );

      instructions.push(
        Token.createInitAccountInstruction(
          TOKEN_PROGRAM_ID,
          NATIVE_MINT,
          newWSOLAccount.publicKey,
          publicKey
        )
      );
      buyerTokenAccountPubkey = newWSOLAccount.publicKey;

      // create nft account
      const newNftAccount = Keypair.generate();
      const createNewNftAccount = SystemProgram.createAccount({
        fromPubkey: publicKey,
        newAccountPubkey: newNftAccount.publicKey,
        lamports: balanceNeeded,
        space: AccountLayout.span,
        programId: TOKEN_PROGRAM_ID,
      });

      instructions.push(createNewNftAccount);

      instructions.push(
        Token.createInitAccountInstruction(
          TOKEN_PROGRAM_ID,
          nftMintPubkey,
          newNftAccount.publicKey,
          publicKey
        )
      );
      buyerNftAccountPubkey = newNftAccount.publicKey;

      const buyDogeIx = new TransactionInstruction({
        programId,
        data: Buffer.from(
          Uint8Array.of(1, ...new BN(expectedNftAmount).toArray("le", 8))
        ),
        keys: [
          { pubkey: buyerAccountPubkey, isSigner: true, isWritable: false },
          {
            pubkey: buyerTokenAccountPubkey,
            isSigner: false,
            isWritable: true,
          },
          { pubkey: buyerNftAccountPubkey, isSigner: false, isWritable: true },
          {
            pubkey: saleState.nftTokenTempAccountPubkey,
            isSigner: false,
            isWritable: true,
          },
          {
            pubkey: saleState.initializerAccountPubkey,
            isSigner: false,
            isWritable: true,
          },
          {
            pubkey: saleState.initializerTokenAccount,
            isSigner: false,
            isWritable: true,
          },
          { pubkey: saleAccountPubkey, isSigner: false, isWritable: true },
          { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
          { pubkey: PDA[0], isSigner: false, isWritable: false },
        ],
      });

      instructions.push(buyDogeIx);

      instructions.push(
        Token.createCloseAccountInstruction(
          TOKEN_PROGRAM_ID,
          newWSOLAccount.publicKey,
          publicKey,
          publicKey,
          []
        )
      );
      const txid = await sendTransaction(connection, wallet, instructions, [
        newWSOLAccount,
        newNftAccount,
      ]);
      console.log("Transaction sent. ", txid);
      addToast(`Transaction sent: ${shortenAddress(txid)}`, {
        appearance: "success",
      });
      await connection.confirmTransaction(txid);
      setSoldOut(true);
    } else {
      addToast("Walet needs to be connected.", {
        appearance: "warning",
      });
    }
    setLoading(false);
  };

  const nftToken = nftIndex.find((e) => e.mintAddress === pid);
  if (!nftToken) {
    return (
      <Layout>
        <div className="p-5">Oop. No doge for you.</div>
      </Layout>
    );
  }
  const nftTokenURI = nftToken.tokenURI;
  const nftPrice = nftToken.price;

  return (
    <Layout>
      <div className="flex items-center justify-center">
        <div className="justify-center">
          {pid && nftTokenURI ? (
            <div>
              <div className="flex mb-5 justify-center items-center">
                <Image src={nftTokenURI} width={200} height={200} />
              </div>
              <div className="space-y-5">
                <p className="my-8 font-bold text-4xl text-center">
                  #{pid.slice(0, 5).toString().toUpperCase()}
                </p>
                <div className="px-3">
                  {!soldOut ? (
                    <div>
                      <p className="my-5 text-2xl text-center">
                        <span className="text-sm text-gray-500">Price</span>{" "}
                        {nftPrice} SOL
                      </p>
                      <button
                        className={
                          "w-full justify-center bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full"
                        }
                        onClick={buyDoge}
                      >
                        {loading ? "Loading..." : "Own"}
                      </button>
                    </div>
                  ) : (
                    <button
                      className={
                        "disabled w-full justify-center bg-gray-500 text-white font-bold py-2 px-4 rounded-full"
                      }
                    >
                      Sold out
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-5">Oop. No doge for you.</div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default DogePage;
