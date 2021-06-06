import Document, { Html, Head, Main, NextScript } from "next/document";

import { GA_TRACKING_ID } from "../lib/gtag";

export default class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          <meta property="og:url" content="https://cryptodoge.xyz" />
          <meta property="og:type" content="website" />
          <meta property="og:title" content="CryptoDoge" />
          <meta name="twitter:card" content="summary" />
          <meta
            property="og:description"
            content="Making trip to the moon less lonely."
          />
          <meta
            property="og:image"
            content="https://cryptodoge.s3.ap-northeast-2.amazonaws.com/cryptodoge-prev.jpg"
          />
          {/* Global Site Tag (gtag.js) - Google Analytics */}
          <script
            async
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
          />
          <script
            dangerouslySetInnerHTML={{
              __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_TRACKING_ID}', {
              page_path: window.location.pathname,
            });
          `,
            }}
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
