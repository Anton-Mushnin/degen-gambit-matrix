import { http, createConfig } from '@wagmi/core'
import { defineChain, type Chain } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { NETWORKS } from './networks'

export const thirdwebClientId = import.meta.env.VITE_THIRDWEB_CLIENT_ID
export const privateKey = import.meta.env.VITE_PRIVATE_KEY
export const privateKeyAddress = privateKey ? privateKeyToAccount(privateKey).address : undefined

// XAI Testnet configuration
export const XAI_TESTNET = {
    chainId: 37714555429,
    name: 'xaiTestnet',
    displayName: 'XAI Testnet v2',
    rpcs: ['https://testnet-v2.xai-chain.net/rpc'],
    blockExplorerUrls: ['https://sepolia.xaiscan.io'],
    nativeCurrency: {
      decimals: 18,
      name: 'sXAI',
      symbol: 'sXAI'
    },
  }

export const TESTNET = {
    chainId: 13746,
    name: 'game7Testnet',
    displayName: 'G7 Sepolia',
    rpcs: ['https://testnet-rpc.game7.io'],
    blockExplorerUrls: ['https://testnet.game7.io'],
    nativeCurrency: {
      decimals: 18,
      name: 'Testnet Game7 Token',
      symbol: 'TG7T'
    },
  }



export const g7Testnet = {
  id: 13746,
  name: 'g7 sepolia',
  nativeCurrency: { name: 'TG7T', symbol: 'TG7T', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://testnet-rpc.game7.io'] },
  },
  blockExplorers: {
    default: { name: 'Game7', url: 'https://testnet.game7.io' },
  },
  contracts: {
    multicall3: {
      address: '0xca11bde05977b3631167028862be2a173976ca11',
      blockCreated: 362914,
    },
  },
} as const satisfies Chain


export const wagmiConfig = createConfig({
  chains: [g7Testnet, NETWORKS.XAI_TESTNET],
  transports: {
    [g7Testnet.id]: http(),
    [NETWORKS.XAI_TESTNET.id]: http(),
  },
})

export const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS

export const viemG7Testnet = defineChain({
  id: wagmiConfig.chains[0].id,
  name: wagmiConfig.chains[0].name,
  nativeCurrency: wagmiConfig.chains[0].nativeCurrency,
  blockExplorers: wagmiConfig.chains[0].blockExplorers,
  rpcUrls: wagmiConfig.chains[0].rpcUrls,
})



export const thirdWebG7Testnet = {
  ...viemG7Testnet,
  rpc: viemG7Testnet.rpcUrls["default"].http[0],
  blockExplorers: [{
      name: "Game7",
      url: viemG7Testnet.blockExplorers.default.url
  }],
  testnet: true,
}

export const thirdWebXaiTestnet = {
  ...NETWORKS.XAI_TESTNET,
  rpc: NETWORKS.XAI_TESTNET.rpcUrls["default"].http[0],
  blockExplorers: [{
      name: "Xai Sepolia Explorer",
      url: NETWORKS.XAI_TESTNET.blockExplorers.default.url
  }],
  testnet: true,
}
