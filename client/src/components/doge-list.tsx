import Image from "next/image";
import Link from "next/link";
import nftIndex from "../solana/nftIndex";

const DogeList = () => {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
      {nftIndex.map((e, i) => (
        <div
          key={`doge-${i}`}
          className="p-2 border-transparent hover:border-gray-50 border-2 rounded-lg"
        >
          <Link href={`/doge/${e.mintAddress}?s=${e.saleProgramId}`}>
            <a>
              <Image src={e.tokenURI} width={200} height={200} />
            </a>
          </Link>
        </div>
      ))}
    </div>
  );
};

export default DogeList;
