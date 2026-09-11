require("@nomiclabs/hardhat-ethers");
require("@nomicfoundation/hardhat-verify");
require("dotenv").config();

const PRIVATE_KEY = process.env.DEPLOYMENT_KEY || process.env.PRIVATE_KEY || "0x1111111111111111111111111111111111111111111111111111111111111111";

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 31337,
      gas: 12000000,
      blockGasLimit: 12000000,
      allowUnlimitedContractSize: true,
    },
    localhost: {
      chainId: 31337,
      gas: 12000000,
      blockGasLimit: 12000000,
      allowUnlimitedContractSize: true,
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "https://sepolia.infura.io/v3/your-api-key",
      accounts: [PRIVATE_KEY],
      chainId: 11155111,
      gas: 6000000,
      gasPrice: 20000000000, // 20 gwei
      blockConfirmations: 6,
    },
    mumbai: {
      url: process.env.MUMBAI_RPC_URL || "https://polygon-mumbai.infura.io/v3/your-api-key",
      accounts: [PRIVATE_KEY],
      chainId: 80001,
      gas: 6000000,
      gasPrice: 8000000000, // 8 gwei
      blockConfirmations: 6,
    },
    polygon: {
      url: process.env.POLYGON_RPC_URL || "https://polygon-mainnet.infura.io/v3/your-api-key",
      accounts: [PRIVATE_KEY],
      chainId: 137,
      gas: 6000000,
      gasPrice: 40000000000, // 40 gwei
      blockConfirmations: 6,
    },
    mainnet: {
      url: process.env.MAINNET_RPC_URL || "https://mainnet.infura.io/v3/your-api-key",
      accounts: [PRIVATE_KEY],
      chainId: 1,
      gas: 6000000,
      gasPrice: 20000000000, // 20 gwei
      blockConfirmations: 6,
    },
    "g7-testnet": {
      url: "https://testnet-rpc.game7.io",
      accounts: [PRIVATE_KEY],
      chainId: 13746,
      gas: 12000000,
      gasPrice: 20000000000, // 20 gwei
      blockConfirmations: 1,
      timeout: 60000,
    },
    "xai-testnet": {
      url: "https://testnet-v2.xai-chain.net/rpc",
      accounts: [PRIVATE_KEY],
      chainId: 37714555429,
      gas: 12000000,
      gasPrice: 1000000000, // 1 gwei
      blockConfirmations: 1,
      timeout: 60000,
    },
    "arbitrum-blueberry": {
      url: "https://rpc.arb-blueberry.gelato.digital",
      accounts: [PRIVATE_KEY],
      chainId: 88153591557,
      gas: 12000000,
      gasPrice: 1000000000, // 1 gwei
      blockConfirmations: 1,
      timeout: 60000,
    },
    "xprotocol-testnet": {
      url: "https://rpc.testnet.xprotocol.org",
      accounts: [PRIVATE_KEY],
      chainId: 83144,
      gas: 12000000,
      gasPrice: 1000000000, // 1 gwei
      blockConfirmations: 1,
      timeout: 60000,
    },
    "jasmy-testnet": {
      url: "https://jasmy-chain-testnet.alt.technology",
      accounts: [PRIVATE_KEY],
      chainId: 681,
      gas: 12000000,
      gasPrice: 1000000000, // 1 gwei
      blockConfirmations: 1,
      timeout: 60000,
    },
  },
  solidity: {
    compilers: [
      {
        version: "0.8.24",
        settings: {
          evmVersion: "cancun",
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.8.20",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.8.19",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.6.6",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },

  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  
  etherscan: {
    apiKey: {
      'jasmy-testnet': 'empty'
    },
    customChains: [
      {
        network: "jasmy-testnet",
        chainId: 681,
        urls: {
          apiURL: "https://jasmy-chain-testnet-explorer.alt.technology:443/api",
          browserURL: "https://jasmy-chain-testnet-explorer.alt.technology:443"
        }
      }
    ]
  }
}; 