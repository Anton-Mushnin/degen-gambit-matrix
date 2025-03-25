import { http, createConfig } from '@wagmi/core'
import { defineChain, type Chain } from 'viem'


export const thirdwebClientId = import.meta.env.VITE_THIRDWEB_CLIENT_ID
export const privateKey = import.meta.env.VITE_PRIVATE_KEY

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
  chains: [g7Testnet],
  transports: {
    [g7Testnet.id]: http(),
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


export const ZIG_ZAG_ZOG_VERSION = '0.1.0'
