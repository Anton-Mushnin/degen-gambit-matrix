import { http, createConfig } from '@wagmi/core'
import { type Chain } from 'viem'


export const thirdwebClientId = import.meta.env.VITE_THIRDWEB_CLIENT_ID

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

  const nodeBalancerTestnet = `https://nb.moonstream.to/nb/game7-testnet/jsonrpc/7d3d4cb1-1228-48da-b5b6-ea3f37a43c90`;


export const g7Testnet = {
  id: 13746,
  name: 'g7 sepolia',
  nativeCurrency: { name: 'TG7T', symbol: 'TG7T', decimals: 18 },
  rpcUrls: {
    default: { http: [nodeBalancerTestnet] },
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
