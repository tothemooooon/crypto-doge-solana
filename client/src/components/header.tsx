import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { useWallet } from "../contexts/wallet";
import { shortenAddress } from "../utils/format";

const Header = () => {
  const { connected, wallet, connect, disconnect } = useWallet();
  const router = useRouter();
  const [showDisconnect, setShowDisconnect] = useState(false);

  return (
    <nav className="py-5 flex items-center justify-between">
      <div className="">
        <Link href={"/"}>
          <a>
            <span className="font-semibold text-xl">CryptoDoge</span>
            <span className="ml-1 text-xs text-gray-500">alpha</span>
          </a>
        </Link>
      </div>
      <div className="flex items-center">
        {connected ? (
          <div className="px-4">
            <button
              className={
                "bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded-full"
              }
              onClick={() => router.push("/user-account")}
            >
              Account
            </button>
          </div>
        ) : null}
        <div>
          {connected ? (
            <button
              className={`bg-transparent ${
                showDisconnect ? "hover:bg-red-400" : "hover:bg-blue-500"
              } text-blue-700 font-semibold hover:text-white py-2 px-6 border border-blue-500 hover:border-transparent rounded-full`}
              style={{ width: "150px" }}
              onClick={() => {
                disconnect();
                router.push("/");
              }}
              onMouseEnter={() => setShowDisconnect(true)}
              onMouseLeave={() => setShowDisconnect(false)}
            >
              {showDisconnect
                ? "Disconnect"
                : shortenAddress(`${wallet?.publicKey}`)}
            </button>
          ) : (
            <button
              className={
                "bg-blue-500 hover:bg-blue-700 text-white font-semibold py-2 px-4 border rounded-full"
              }
              onClick={() => connect()}
            >
              Connect
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};
export default Header;
