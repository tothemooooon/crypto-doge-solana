import Head from "next/head";
import Header from "./header";

const Layout: React.FC = ({ children }) => {
  return (
    <div>
      <Head>
        <title>CryptoDoge</title>
        <meta name="description" content="To the moon" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={"max-w-2xl mx-auto"}>
        <Header />
        {children}
      </div>
    </div>
  );
};

export default Layout;
