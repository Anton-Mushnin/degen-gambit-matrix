import { type Chain, defineChain } from 'viem'

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
    default: { name: 'Xai Testnet v2', url: 'https://testnet-explorer-v2.xai-chain.net/' },
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

// Jasmy Chain Testnet
export const jasmyTestnet = {
  id: 681, 
  name: 'Jasmy Chain Testnet',
  nativeCurrency: { name: 'JASMY', symbol: 'JASMY', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://jasmy-chain-testnet.alt.technology'] }, 
  },
  blockExplorers: {
    default: { name: 'Jasmy Explorer', url: 'jasmy-chain-testnet-explorer.alt.technology' }, // Placeholder
  },
  faucets: ['http://13.49.243.124/'],
  testnet: true,
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
  JASMY_TESTNET: jasmyTestnet,
} as const 

// Network utility functions
export function getViemNetwork(networkKey: keyof typeof NETWORKS): Chain {
  const network = NETWORKS[networkKey];
  return defineChain({
    id: network.id,
    name: network.name,
    nativeCurrency: network.nativeCurrency,
    blockExplorers: network.blockExplorers,
    rpcUrls: network.rpcUrls,
  });
}

export function getThirdWebNetwork(networkKey: keyof typeof NETWORKS) {
  const viemNetwork = getViemNetwork(networkKey);
  return {
    ...viemNetwork,
    rpc: viemNetwork.rpcUrls["default"].http[0],
    blockExplorers: viemNetwork.blockExplorers ? [{
      name: viemNetwork.blockExplorers.default.name,
      url: viemNetwork.blockExplorers.default.url
    }] : [],
    testnet: true,
  };
}

// Fine, Neo... I'll try to

export function getViemChainById(chainId: number): Chain {
  for (const key of Object.keys(NETWORKS) as Array<keyof typeof NETWORKS>) {
    const network = NETWORKS[key];
    if (network.id === chainId) {
      return getViemNetwork(key);
    }
  }
  throw new Error(`No network found for chainId: ${chainId}`);
}

export function getThirdWebChainById(chainId: number) {
  for (const key of Object.keys(NETWORKS) as Array<keyof typeof NETWORKS>) {
    const network = NETWORKS[key];
    if (network.id === chainId) {
      return getThirdWebNetwork(key);
    }
  }
  throw new Error(`No network found for chainId: ${chainId}`);
}




