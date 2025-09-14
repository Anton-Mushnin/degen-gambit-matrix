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
  contracts: {
    multicall3: {
      address: '0xca11bde05977b3631167028862be2a173976ca11',
      blockCreated: 222549,
    },
  },
} as const satisfies ExtendedChain

// Arbitrum Blueberry Testnet
export const arbitrumBlueberry = {
  id: 88153591557,
  name: 'Arbitrum Blueberry',
  nativeCurrency: { name: 'CGT', symbol: 'CGT', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.arb-blueberry.gelato.digital'] },
  },
  blockExplorers: {
    default: { name: 'Arbitrum Blueberry Explorer', url: 'https://arb-blueberry.gelatoscout.com' },
  },
  testnet: true,
  contracts: {
    multicall3: {
      address: '0xEc10A32fF915D672a8A062eea9d48370232072Df',
      blockCreated: 1,
    },
  },
} as const satisfies ExtendedChain

// xProtocol Network
export const xProtocolTestnet = {
  id: 83144,
  name: 'XProtocol Testnet',
  nativeCurrency: { name: 'KICK', symbol: 'KICK', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.testnet.xprotocol.org'] },
  },
  blockExplorers: {
    default: { name: 'xProtocol Explorer', url: 'https://explorer.testnet.xprotocol.org' },
  },
  faucets: ['https://xprotocol.org/faucets'],
  contracts: {
    multicall3: {
      address: '0xca11bde05977b3631167028862be2a173976ca11',
      blockCreated: 0,
    },
  },
} as const satisfies ExtendedChain

export const NETWORKS = {
  G7_TESTNET: g7Testnet,
  XAI_TESTNET: xaiTestnet,
  ARBITRUM_BLUEBERRY: arbitrumBlueberry,
  XPROTOCOL_TESTNET: xProtocolTestnet,
} as const 