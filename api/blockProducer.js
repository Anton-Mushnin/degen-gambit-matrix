// /api/blockProducer.js
import { createWalletClient, createPublicClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import dotenv from 'dotenv';
import { NETWORKS } from '../src/config/networks.js';

// Load environment variables
dotenv.config();

// Helper function to get network from request
function getNetworkFromRequest(req) {
  const networkId = req.body?.networkId || req.query?.networkId;
  
  if (!networkId) {
    throw new Error(`Network ID is required. Available networks: ${Object.keys(NETWORKS).join(', ')}`);
  }
  
  const selectedNetwork = Object.values(NETWORKS).find(network => network.id === networkId);
  
  if (!selectedNetwork) {
    throw new Error(`Invalid network ID: ${networkId}. Available networks: ${Object.keys(NETWORKS).join(', ')}`);
  }
  
  return selectedNetwork;
}

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get network from request
    const selectedNetwork = getNetworkFromRequest(req);
    
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
      chain: selectedNetwork,
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
      chain: selectedNetwork,
      transport: http()
    });
    
    // Send a minimal transaction to create a new block
    const hash = await walletClient.sendTransaction({
      to: account.address,
      value: BigInt(1), // Minimal amount
      chain: selectedNetwork,
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