require("@nomiclabs/hardhat-ethers");
require("dotenv").config({ path: "../../../../.env" });

const DEPLOYMENT_KEY = process.env.DEPLOYMENT_KEY;

if (!DEPLOYMENT_KEY) {
  console.error("Please set DEPLOYMENT_KEY in your .env file");
  process.exit(1);
}

module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    "xai-testnet": {
      url: "https://testnet-v2.xai-chain.net/rpc",
      chainId: 37714555429,
      accounts: [DEPLOYMENT_KEY],
      gasPrice: 1000000000, // 1 gwei
    }
  },
  paths: {
    sources: "./",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
}; 