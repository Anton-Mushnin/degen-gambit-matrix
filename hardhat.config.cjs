require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const PRIVATE_KEY = process.env.DEPLOYMENT_KEY || "";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  networks: {
    // For testnets
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia.publicnode.com",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
    // For mainnet
    mainnet: {
      url: process.env.MAINNET_RPC_URL || "https://eth.llamarpc.com",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
    // Add any other networks you need
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || "",
  },
}; 