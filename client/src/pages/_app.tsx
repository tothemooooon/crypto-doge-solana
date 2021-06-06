import * as dotenv from "dotenv";
dotenv.config();
import { AppProps } from "next/app";
import "tailwindcss/tailwind.css";
import "../styles/custom.css";
import { ConnectionProvider } from "../contexts/connection";
import { WalletProvider } from "../contexts/wallet";
import { AccountsProvider } from "../contexts/accounts";
import { ToastProvider } from "react-toast-notifications";
import * as gtag from "../lib/gtag";
import { useRouter } from "next/router";
import { useEffect } from "react";

function MyApp({ Component, pageProps }: AppProps): JSX.Element {
  const router = useRouter();
  useEffect(() => {
    const handleRouteChange = (url: any) => {
      gtag.pageview(url);
    };
    router.events.on("routeChangeComplete", handleRouteChange);
    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, [router.events]);
  return (
    <ConnectionProvider>
      <WalletProvider>
        <AccountsProvider>
          <ToastProvider
            autoDismiss
            autoDismissTimeout={5000}
            placement="bottom-center"
          >
            <Component {...pageProps} />
          </ToastProvider>
        </AccountsProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default MyApp;
