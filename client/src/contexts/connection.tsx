import {
  clusterApiUrl,
  Connection,
  Cluster,
  Commitment,
  TransactionInstruction,
  Keypair,
  Transaction,
} from "@solana/web3.js";
import React, { useContext } from "react";
import { ENV as ChainID } from "@solana/spl-token-registry";
import { WalletAdapter } from "./wallet";
import { ExplorerLink } from "../components/explorer-link";
import { ENV } from "../constants";

type Localnet = "localnet";
const DEFAULT = ENV.Devnet;
const DEFAULT_ENDPOINT = DEFAULT.endpoint;

type ConnectionConfig = {
  connection: Connection;
  endpoint: string;
  cluster: Cluster;
};

const ConnectionContext = React.createContext<ConnectionConfig>({
  connection: new Connection(DEFAULT.cluster, "recent"),
  endpoint: DEFAULT_ENDPOINT,
  cluster: DEFAULT.cluster,
});

export function ConnectionProvider({ children = undefined as any }): any {
  const connection = new Connection(DEFAULT.endpoint, "recent");
  const endpoint = DEFAULT.endpoint;
  const cluster = DEFAULT.cluster;

  return (
    <ConnectionContext.Provider value={{ connection, endpoint, cluster }}>
      {children}
    </ConnectionContext.Provider>
  );
}

export function useConnection() {
  return useContext(ConnectionContext).connection as Connection;
}

export function useConnectionConfig() {
  const context = useContext(ConnectionContext);
  return {
    connection: context.connection,
    endpoint: context.endpoint,
    cluster: context.cluster,
  };
}

const getErrorForTransaction = async (connection: Connection, txid: string) => {
  // wait for all confirmation before geting transaction
  await connection.confirmTransaction(txid, "max");

  const tx = await connection.getParsedConfirmedTransaction(txid, "confirmed");

  const errors: string[] = [];
  if (tx?.meta && tx.meta.logMessages) {
    tx.meta.logMessages.forEach((log) => {
      const regex = /Error: (.*)/gm;
      let m;
      while ((m = regex.exec(log)) !== null) {
        // This is necessary to avoid infinite loops with zero-width matches
        if (m.index === regex.lastIndex) {
          regex.lastIndex++;
        }

        if (m.length > 1) {
          errors.push(m[1]);
        }
      }
    });
  }

  return errors;
};

export const sendTransaction = async (
  connection: Connection,
  wallet: WalletAdapter,
  instructions: TransactionInstruction[],
  signers: Keypair[],
  awaitConfirmation = true
) => {
  if (!wallet?.publicKey) {
    throw new Error("Wallet is not connected");
  }

  let transaction = new Transaction();
  instructions.forEach((instruction) => transaction.add(instruction));
  transaction.recentBlockhash = (
    await connection.getRecentBlockhash("max")
  ).blockhash;

  transaction.feePayer = wallet.publicKey;

  if (signers.length > 0) {
    transaction.partialSign(...signers);
  }
  transaction = await wallet.signTransaction(transaction);
  const rawTransaction = transaction.serialize();
  let options = {
    skipPreflight: true,
    commitment: "singleGossip",
  };

  const txid = await connection.sendRawTransaction(rawTransaction, options);

  if (awaitConfirmation) {
    const status = (
      await connection.confirmTransaction(
        txid,
        options && (options.commitment as any)
      )
    ).value;

    if (status?.err) {
      const errors = await getErrorForTransaction(connection, txid);
      console.log({
        message: "Transaction failed...",
        description: (
          <>
            {errors.map((err) => (
              <div>{err}</div>
            ))}
            <ExplorerLink address={txid} type="transaction" />
          </>
        ),
        type: "error",
      });

      throw new Error(
        `Raw transaction ${txid} failed (${JSON.stringify(status)})`
      );
    }
  }

  return txid;
};
