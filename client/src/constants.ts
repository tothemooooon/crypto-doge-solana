import * as dotenv from "dotenv";
dotenv.config();
import { clusterApiUrl, Cluster, Commitment } from "@solana/web3.js";
import { ENV as ChainID } from "@solana/spl-token-registry";

export const COMMITMENT: Commitment = "singleGossip";

export const ENV = {
  Mainnet: {
    cluster: "mainnet-beta" as Cluster,
    endpoint: "https://solana-api.projectserum.com/",
    chainID: ChainID.MainnetBeta,
  },
  Testnet: {
    cluster: "testnet" as Cluster,
    endpoint: clusterApiUrl("testnet"),
    ChainID: ChainID.Testnet,
  },
  Devnet: {
    cluster: "devnet" as Cluster,
    endpoint: clusterApiUrl("devnet"),
    chainID: ChainID.Devnet,
  },
  Localnet: {
    cluster: "localnet" as Cluster,
    endpoint: "http://127.0.0.1:8899",
    chainID: ChainID.Devnet,
  },
};

let ROOT_ACCOUNT_PRIVATE_KEY: number[];
if (process.env.ROOT_ACCOUNT_PRIVATE_KEY) {
  ROOT_ACCOUNT_PRIVATE_KEY = process.env
    .ROOT_ACCOUNT_PRIVATE_KEY!.split(",")
    .map((s) => parseInt(s));
}
export { ROOT_ACCOUNT_PRIVATE_KEY };
export const CRYPTO_DOGE_PROGRAM_ID = process.env.CRYPTO_DOGE_PROGRAM_ID!;

export const CRYPTO_DOGE_TOTAL_NUM = 20;
export const ROOT_WSOL_ACCOUNT_PUBKEY = process.env.ROOT_WSOL_ACCOUNT_PUBKEY!;
