module.exports = {
  images: {
    domains: [
      "gateway.pinata.cloud",
      "cryptodoge.s3.ap-northeast-2.amazonaws.com",
    ],
  },
  webpack: (config, { isServer }) => {
    // Fixes npm packages that depend on `fs` module
    if (!isServer) {
      config.node = {
        fs: "empty",
      };
    }

    return config;
  },
};
