import { AccountLayout, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { ParsedAccountData, PublicKey } from "@solana/web3.js";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { TokenAccount } from "../models/account";
import { useConnection } from "./connection";
import { useWallet } from "./wallet";

const AccountsContext = React.createContext<any>(null);

export const useAccountsContext = () => {
  const context = useContext(AccountsContext);
  return context;
};

export function AccountsProvider({ children = null as any }) {
  const connection = useConnection();
  const { publicKey, connected } = useWallet();
  const [tokenAccounts, setTokenAccounts] = useState<TokenAccount[]>([]);
  const [userAccounts, setUserAccounts] = useState<TokenAccount[]>([]);
  const selectUserAccounts = async () => {
    if (!publicKey) {
      return [];
    }

    const accounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
      programId: TOKEN_PROGRAM_ID,
    });
    setUserAccounts(accounts.value);
    return accounts;
  };

  useEffect(() => {
    selectUserAccounts();
  }, [publicKey]);

  useEffect(() => {
    if (!publicKey) return;

    const id = connection.onAccountChange(
      publicKey!,
      () => {
        selectUserAccounts();
      },
      "singleGossip"
    );
    return () => {
      connection.removeAccountChangeListener(id);
    };
  }, [publicKey]);

  // useEffect(() => {
  //   const tokenSubID = connection.onProgramAccountChange(
  //     TOKEN_PROGRAM_ID,
  //     () => {
  //       selectUserAccounts();
  //     },
  //     "singleGossip"
  //   );

  //   return () => {
  //     connection.removeProgramAccountChangeListener(tokenSubID);
  //   };
  // }, [connection]);

  return (
    <AccountsContext.Provider
      value={{
        userAccounts,
      }}
    >
      {children}
    </AccountsContext.Provider>
  );
}
