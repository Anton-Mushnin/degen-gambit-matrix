import { type Chain } from 'viem'

// Extended chain type to include faucets
type ExtendedChain = Chain & {
  faucets?: string[];
}

// Game7 Testnet (existing)
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
} as const satisfies ExtendedChain

// Xai Testnet v2 (new)
export const xaiTestnet = {
  id: 37714555429,
  name: 'Xai Testnet v2',
  nativeCurrency: { name: 'sXAI', symbol: 'sXAI', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://testnet-v2.xai-chain.net/rpc'] },
  },
  blockExplorers: {
    default: { name: 'Xai Sepolia Explorer', url: 'https://sepolia.xaiscan.io' },
  },
  faucets: ['https://faucet.quicknode.com/xai'],
  testnet: true,
} as const satisfies ExtendedChain

export const NETWORKS = {
  G7_TESTNET: g7Testnet,
  XAI_TESTNET: xaiTestnet,
} as const 