import DogeList from "../components/doge-list";
import Layout from "../components/layout";
import { TiWarningOutline } from "react-icons/ti";

export default function Home() {
  return (
    <Layout>
      <div
        className="flex p-5 rounded-lg items-top"
        style={{ backgroundColor: "rgba(253, 230,138, 1)" }}
      >
        <TiWarningOutline size={24} />
        <div style={{ paddingLeft: "0.2rem" }}>
          Under active development. Currently on Solana Devnet only. On-chain
          accounts reset periodically during development.
        </div>
      </div>
      <div>
        <p className="my-10">
          What is the purpose of going to the moon if you don’t have a doge
          buddy? CryptoDoge makes the trip less lonely.
        </p>
      </div>
      <DogeList />
      <div className="flex items-center font-bold text-lg mb-5">
        and 980 more to come...
      </div>
      <div className="flex items-center italic text-lg mb-5">
        Cooler doges, more token functions (auction, transfer, on-chain
        verifiable credential, interoperability)
      </div>
      <hr />
      <div className="mt-10">
        <div className="font-bold mt-5">What is CryptoDoge?</div>
        <div>1000 unique doges. Inspired by CryptoPunks. Built on Solana.</div>
        <div className="font-bold mt-5">What inspired CryptoDoge?</div>
        <div>It is nice to have friends.</div>
        <div className="font-bold mt-5">But why?</div>
        <div>Why not?</div>
        <div className="font-bold mt-5">Isn't it like a waste of time?</div>
        <div>The time you enjoy wasting, is not wasted time.</div>
        <div className="font-bold mt-5">How can I buy?</div>
        <div>Don't buy. Adopt.</div>
        <div className="font-bold mt-5">Is this a scam?</div>
        <div>If enough people believe in it, no.</div>
      </div>
      <div className="flex justify-between">
        <div className="my-10 text-gray-500">© 2021 ToTheMoon</div>
        <div className="flex space-x-5">
          <div className="my-10 text-gray-500">
            <a href="https://twitter.com/samyouxyz" target="__blank">
              @samyouxyz
            </a>
          </div>
          <div className="my-10 text-gray-500">
            <a href="https://twitter.com/Zassers" target="__blank">
              @Zassers
            </a>
          </div>
          <div className="my-10 text-gray-500">
            <a href="https://twitter.com/layhaktann" target="__blank">
              @layhaktann
            </a>
          </div>
        </div>
      </div>
    </Layout>
  );
}
