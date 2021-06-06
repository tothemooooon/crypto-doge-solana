import { AccountInfo, ParsedAccountData, PublicKey } from "@solana/web3.js";
import { AccountInfo as TokenAccountInfo } from "@solana/spl-token";

export interface TokenAccount {
  pubkey: PublicKey;
  account: AccountInfo<ParsedAccountData>;
}
