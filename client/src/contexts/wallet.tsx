import type { PublicKey } from "@solana/web3.js";

import Wallet from "@project-serum/sol-wallet-adapter";
import { Transaction } from "@solana/web3.js";
import EventEmitter from "eventemitter3";
import React, { useContext, useEffect, useState } from "react";
import { useConnectionConfig } from "./connection";

const ASSETS_URL =
  "https://raw.githubusercontent.com/solana-labs/oyster/main/assets/wallets/";

export const WALLET_PROVIDERS = [
  {
    name: "Sollet",
    url: "https://www.sollet.io",
    icon: `${ASSETS_URL}sollet.svg`,
  },
];

export interface WalletAdapter extends EventEmitter {
  publicKey: PublicKey | null;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  connect: () => any;
  disconnect: () => any;
}

const WalletContext = React.createContext<{
  wallet: WalletAdapter | undefined;
  connected: boolean;
  provider: typeof WALLET_PROVIDERS[number] | undefined;
}>({
  wallet: undefined,
  connected: false,
  provider: undefined,
});

export function WalletProvider({ children = null as any }) {
  const { endpoint } = useConnectionConfig();
  const provider = WALLET_PROVIDERS[0];

  const [wallet, setWallet] = useState<WalletAdapter>();

  useEffect(() => {
    const w = new Wallet(provider.url, endpoint) as WalletAdapter;
    setWallet(w);
  }, []);

  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (wallet) {
      wallet.on("connect", () => {
        if (wallet.publicKey) {
          setConnected(true);
          const walletPublicKey = wallet.publicKey.toBase58();
          console.log({
            message: "Wallet update",
            description: "Connected to wallet " + walletPublicKey,
          });
        }
      });

      wallet.on("disconnect", () => {
        setConnected(false);
        console.log({
          message: "Wallet update",
          description: "Disconnected from wallet",
        });
      });
    }

    return () => {
      setConnected(false);
      if (wallet) {
        wallet.disconnect();
      }
    };
  }, [wallet]);

  return (
    <WalletContext.Provider
      value={{
        wallet,
        connected,
        provider,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const { wallet, connected, provider } = useContext(WalletContext);
  return {
    wallet,
    connected,
    provider,
    publicKey: wallet?.publicKey,
    connect() {
      wallet?.connect();
    },
    disconnect() {
      wallet?.disconnect();
    },
  };
}
