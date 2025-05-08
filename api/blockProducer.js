// /api/blockProducer.js
import { createWalletClient, createPublicClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Define chain configuration
const g7TestnetChain = {
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
};

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get block producer private key from environment variables
    const blockProducerKey = process.env.BLOCK_PRODUCER_PRIVATE_KEY;
    
    if (!blockProducerKey) {
      return res.status(500).json({
        created: false,
        message: 'Block producer key not configured'
      });
    }
    
    // Get the latest block info
    const publicClient = createPublicClient({
      chain: g7TestnetChain,
      transport: http()
    });
    
    const latestBlock = await publicClient.getBlock();
    const latestBlockTimestamp = Number(latestBlock.timestamp);
    const currentTime = Math.floor(Date.now() / 1000);
    const timeDiff = currentTime - latestBlockTimestamp;
    
    // Check if a new block is needed
    const maxAgeSeconds = req.body?.maxAgeSeconds || 5;
    if (timeDiff <= maxAgeSeconds) {
      return res.status(200).json({
        created: false,
        message: "Latest block is recent enough",
        latestBlockTimestamp,
        currentTime,
        timeDiff
      });
    }
    
    // Create a wallet client using the block producer private key
    const account = privateKeyToAccount(blockProducerKey);
    const walletClient = createWalletClient({
      account,
      chain: g7TestnetChain,
      transport: http()
    });
    
    // Send a minimal transaction to create a new block
    const hash = await walletClient.sendTransaction({
      to: account.address,
      value: BigInt(1), // Minimal amount
      chain: g7TestnetChain,
    });
    
    return res.status(200).json({
      created: true,
      message: `New block created with transaction: ${hash}`,
      latestBlockTimestamp,
      currentTime,
      timeDiff,
      hash
    });
  } catch (error) {
    console.error('Error in block production API:', error);
    return res.status(500).json({
      created: false,
      error: error.message || String(error)
    });
  }
}