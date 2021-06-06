import Image from "next/image";
import { useEffect, useState } from "react";
import { useWallet } from "../contexts/wallet";
import { useUserAccounts } from "../hooks/useUserAccounts";
import nftIndex from "../solana/nftIndex";

const nftMintKeys = nftIndex.map((e) => e.mintAddress);

const UserDoges = () => {
  const { publicKey } = useWallet();
  const { userAccounts } = useUserAccounts();
  const [ownedMintStrings, setOwnedMintStrings] = useState<any>([]);

  useEffect(() => {
    if (publicKey) {
      const accounts = userAccounts.filter((acc) => {
        const accountInfo = acc.account.data.parsed.info;
        return (
          nftMintKeys.includes(accountInfo.mint) &&
          accountInfo.tokenAmount.uiAmount > 0
        );
      });
      const mintStrings = accounts.map((e) => e.account.data.parsed.info.mint);
      setOwnedMintStrings(mintStrings);
    }
  }, [userAccounts]);
  return (
    <div>
      {ownedMintStrings.length > 0 ? (
        nftIndex
          .filter((e) => ownedMintStrings.includes(e.mintAddress))
          .map((e, i) => (
            <div key={`d-${i}`} className="flex items-center justify-center">
              <Image src={e.tokenURI} width={250} height={250} />
              <div className="font-bold text-xl">
                #{e.mintAddress.slice(0, 5).toString().toUpperCase()}
              </div>
            </div>
          ))
      ) : (
        <div className="flex items-center justify-center py-10">
          <img src="/doge-404.gif" />
        </div>
      )}
    </div>
  );
};

export default UserDoges;
