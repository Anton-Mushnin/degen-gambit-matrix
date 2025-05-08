import express from 'express';
import ViteExpress from 'vite-express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createWalletClient, createPublicClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Define chain configuration directly in server.js instead of importing from client code
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

// Block producer API endpoints
app.get('/api/blockProducer/status', async (req, res) => {
  try {
    // Get block producer private key from environment variables
    const blockProducerKey = process.env.BLOCK_PRODUCER_PRIVATE_KEY;
    
    if (!blockProducerKey) {
      return res.status(500).json({
        available: false,
        message: 'Block producer key not configured'
      });
    }
    
    // Create account from the block producer key
    const account = privateKeyToAccount(blockProducerKey);
    
    const publicClient = createPublicClient({
      chain: g7TestnetChain,
      transport: http()
    });
    
    const balance = await publicClient.getBalance({
      address: account.address,
    });
    
    // Minimum balance required for transactions (0.001 ETH equivalent)
    const minBalance = BigInt(1000000000000000);
    
    return res.status(200).json({
      available: balance > minBalance,
      message: balance > minBalance 
        ? 'Block producer is available' 
        : `Insufficient balance: ${balance.toString()}`,
      balance: balance.toString(),
      address: account.address
    });
  } catch (error) {
    console.error('Error checking block producer status:', error);
    return res.status(500).json({
      available: false,
      message: `Error: ${error.message || String(error)}`
    });
  }
});

app.post('/api/blockProducer', async (req, res) => {
  console.log("blockProducer route called")
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
    
    // Get balance
    const balance = await publicClient.getBalance({
      address: account.address,
    });
    
    // Minimum balance required for transactions (0.001 ETH equivalent)
    const minBalance = BigInt(1000000000000000);
    if (balance <= minBalance) {
      return res.status(200).json({
        created: false,
        message: `Insufficient balance for block creation: ${balance.toString()}`,
        latestBlockTimestamp,
        currentTime,
        timeDiff,
        balance: balance.toString()
      });
    }
    
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
});

// Start the server
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Integrate with Vite
ViteExpress.bind(app, server);

export default app; 