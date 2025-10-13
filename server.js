import express from 'express';
import ViteExpress from 'vite-express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createWalletClient, createPublicClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
// Load environment variables
dotenv.config();

// Network definitions
const NETWORKS = {
  G7_TESTNET: {
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
  },
  XAI_TESTNET: {
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
  },
  ARBITRUM_BLUEBERRY: {
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
  },
  XPROTOCOL_TESTNET: {
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
  },
  JASMY_TESTNET: {
    id: 681, 
    name: 'Jasmy Chain Testnet',
    nativeCurrency: { name: 'JASMY', symbol: 'JASMY', decimals: 18 },
    rpcUrls: {
      default: { http: ['https://jasmy-chain-testnet.alt.technology'] }, 
    },
    blockExplorers: {
      default: { name: 'Jasmy Explorer', url: 'jasmy-chain-testnet-explorer.alt.technology' },
    },
    faucets: ['http://13.49.243.124/'],
    testnet: true,
    contracts: {
      multicall3: {
        address: '0xca11bde05977b3631167028862be2a173976ca11',
        blockCreated: 0,
      },
    },
  },
};

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

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

// Block producer API endpoints
app.get('/api/blockProducer/status', async (req, res) => {
  try {
    // Get network from request
    const selectedNetwork = getNetworkFromRequest(req);
    
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
      chain: selectedNetwork,
      transport: http()
    });
    
    const balance = await publicClient.getBalance({
      address: account.address,
    });
    
    // Minimum balance required for transactions (0.001 ETH equivalent)
    // const minBalance = BigInt(1000000000000000);
    
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
  console.log("BlockProducer route called")
  try {

    console.log('req.body', req.body);
    // Get network from request
    const selectedNetwork = getNetworkFromRequest(req);

    console.log('selectedNetwork', selectedNetwork);
    
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
    
    // Get balance
    const balance = await publicClient.getBalance({
      address: account.address,
    });
    console.log('balance', balance);
    console.log('account.address', account.address);
    
    
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
});

// Start the server
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Integrate with Vite
ViteExpress.bind(app, server);

export default app; 