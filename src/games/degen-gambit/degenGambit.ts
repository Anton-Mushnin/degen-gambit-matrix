import { wagmiConfig } from '../../config/index.ts'
import { degenGambitABI } from '../../ABIs/DegenGambit.abi.ts';
import { formatUnits, PublicClient } from 'viem';
import { waitForReceipt } from 'thirdweb/transaction';
import { sendTransaction, prepareContractCall } from 'thirdweb/transaction';
import { Account } from 'thirdweb/wallets';
import { commitRevealSpin } from '../../utils/commitRevealSpin.ts';

import { ThirdwebClient } from 'thirdweb';
import { viemAdapter } from 'thirdweb/adapters/viem';
import { getViemChainById } from '../../config/networks.ts';
import { degenGambitGame } from './index.ts';


    // Helper function to get the current block number and calculate blocks remaining
// Contract constants - loaded once and cached
let CONTRACT_CONSTANTS: {
  blocksToAct: number | null;
  costToRespin: bigint | null;
  loaded: boolean;
} = {
  blocksToAct: null,
  costToRespin: null,
  loaded: false
};

// Load contract constants once
async function loadContractConstants(contractAddress: string, publicClient: PublicClient): Promise<typeof CONTRACT_CONSTANTS> {
  if (CONTRACT_CONSTANTS.loaded) return CONTRACT_CONSTANTS;
  const viemContract = {
    address: contractAddress,
    abi: degenGambitABI,
  } as const;
  
  try {
    // Get all constants in parallel
    const [blocksToAct, costToRespin] = await Promise.all([
      publicClient.readContract({
        ...viemContract,
        functionName: 'BlocksToAct',
      }),
      publicClient.readContract({
        ...viemContract,
        functionName: 'CostToRespin',
      }),
    ]);
    
    // Store the constants
    CONTRACT_CONSTANTS = {
      blocksToAct: Number(blocksToAct),
      costToRespin,
      loaded: true
    };
    
    console.log(`Loaded contract constants: blocksToAct=${blocksToAct}`);
    return CONTRACT_CONSTANTS;
  } catch (error) {
    console.error("Failed to load contract constants:", error);
    return CONTRACT_CONSTANTS;
  }
}

// Cache of last spin blocks by account
const LAST_SPIN_BLOCKS: Record<string, number> = {};

// Get LastSpinBlock for a specific account - only needed after spin/respin
async function _getLastSpinBlock(contractAddress: string, account: string, publicClient: PublicClient, forceRefresh = false): Promise<number | null> {
  // Use cached value if available and not forcing refresh
  if (!forceRefresh && LAST_SPIN_BLOCKS[account] !== undefined) {
    return LAST_SPIN_BLOCKS[account];
  }
  const viemContract = {
    address: contractAddress,
    abi: degenGambitABI,
  } as const;
  
  try {
    const lastSpinBlock = await publicClient.readContract({
      ...viemContract,
      functionName: 'LastSpinBlock',
      args: [account],
    });
    
    // Cache the result
    LAST_SPIN_BLOCKS[account] = Number(lastSpinBlock);
    return LAST_SPIN_BLOCKS[account];
  } catch (error) {
    console.error("Failed to get LastSpinBlock:", error);
    return null;
  }
}

// Main function - now optimized to minimize chain calls
// After a spin/respin, we need to update the last spin block
export const updateLastSpinBlock = async (contractAddress: string, account: string, publicClient: PublicClient) => {
  if (!account) return;
  
  // Force refresh the LastSpinBlock from the chain
  await _getLastSpinBlock(contractAddress, account, publicClient, true);
  console.log(`Updated LastSpinBlock for ${account}`);
};

export const getBlockInfo = async (contractAddress: string, account: string, publicClient: PublicClient, forceRefresh = false) => {
  if (!account) {
    console.error("No account provided to getBlockInfo");
    return null;
  }
  
  try {
    // Load constants if not already loaded
    const constants = await loadContractConstants(contractAddress, publicClient);
    
    // Get last spin block (only value that changes per user)
    const lastSpinBlock = await _getLastSpinBlock(contractAddress, account, publicClient, forceRefresh);
    if (lastSpinBlock === null) return null;
    const currentBlock = await publicClient.getBlockNumber();
    
    // Calculate time remaining
    const blockDeadline = lastSpinBlock + (constants.blocksToAct || 0);
    const blocksRemaining = blockDeadline > currentBlock 
      ? Number(blockDeadline) - Number(currentBlock) 
      : 0;
    
    // Only log when values actually change
    if (forceRefresh) {
      console.log(`BLOCK INFO: Current=${currentBlock}, Last=${lastSpinBlock}, Deadline=${blockDeadline}, Remaining=${blocksRemaining}`);
    }
    
    // Replace any with proper types
    const blockInfo: Record<string, number | bigint> = {
      currentBlock,
      lastSpinBlock,
      blockDeadline,
      blocksToAct: constants.blocksToAct || 0,
      blocksRemaining,
      costToRespin: constants.costToRespin || BigInt(0)
    };
    
    return blockInfo;
  } catch (error) {
    console.error("Error getting block info:", error);
    return null;
  }
};

export const _acceptThirdWebClient = async (contractAddress: string, account: Account | undefined, client: ThirdwebClient, publicClient: PublicClient) => {
  if (!account) {
    throw new Error("No account provided");
  }

  const viemContract = {
    address: contractAddress,
    abi: degenGambitABI,
  } as const;

  const degenAddress = account.address ?? "";

  try {
    // First check if we can get the outcome to see if there's something to accept
    let canAccept = false;
    try {
      // Read the outcome but don't store it if we're not using it
      await publicClient.readContract({
        ...viemContract,
        functionName: 'inspectOutcome',
        args: [degenAddress],
      });
      canAccept = true;
    } catch (error) {
      // If we can't get the outcome, we might not be able to accept
      console.error("Error checking outcome:", error);
    }

    if (!canAccept) {
      return {
        description: "Nothing to accept. Spin first!",
        success: false,
      };
    }
    const chain = getViemChainById(degenGambitGame.network.id as any);

    const contract = viemAdapter.contract.fromViem({
      viemContract: viemContract,
      chain: {
        ...chain,
        rpc: chain.rpcUrls["default"].http[0],
        blockExplorers: [{
          name: chain.blockExplorers?.default.name ?? "",
          url: chain.blockExplorers?.default.url ?? ""
        }],
        testnet: true
      },
      client,
    });

    // Call the accept function to claim any prize
    const tx = prepareContractCall({
      contract,
      method: "accept",
      params: [],
    });

    const transactionResult = await sendTransaction({
      transaction: tx,
      account,
    });

    const receipt = await waitForReceipt(transactionResult);

    return {
      description: "Outcome accepted successfully.",
      success: true,
      receipt,
    };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    
    // Handle specific error cases
    if (errorMsg.includes('DeadlineExceeded')) {
      return {
        description: "Too late! The deadline to accept this outcome has passed.",
        success: false,
        error: errorMsg,
      };
    }

    return {
      description: "Failed to accept: " + errorMsg,
      success: false,
      error: errorMsg,
    };
  }
};

export const accept = async (contractAddress: string, account: Account | undefined, client: ThirdwebClient, publicClient: PublicClient) => {
  return _acceptThirdWebClient(contractAddress, account, client, publicClient);
};

export const spin = async (contractAddress: string, boost: boolean, account: Account | undefined, client: ThirdwebClient, publicClient: PublicClient) => {
  const degenAddress = account?.address ?? "";

  // Get spin cost and decimals for result processing
  const contract = {
    address: contractAddress,
    abi: degenGambitABI,
  } as const;

  const spinCost = await publicClient.readContract({
    ...contract,
    functionName: 'spinCost',
    args: [degenAddress],
  });

  const decimals = await publicClient.readContract({
    ...contract,
    functionName: 'decimals',
  });

  const chainId = await publicClient.getChainId();

  // Use the extracted commit-reveal utility
  const result = await commitRevealSpin({
    contractAddress,
    contractABI: degenGambitABI,
    spinFunctionName: 'spin',
    spinArgs: [boost],
    value: typeof spinCost === 'bigint' ? spinCost : BigInt(0),
    account,
    client,
    publicClient,
    chainId,
  });

  // Process the outcome (game-specific logic)
  const outcome = result.outcome as readonly bigint[];
  let actionText = '';
  if (Number(outcome[4]) > 0) {
    actionText = `You won ${formatUnits(outcome[4], Number(decimals))} ${Number(outcome[5]) === 1 ? wagmiConfig.chains[0].nativeCurrency.symbol : 'GAMBIT'}`;
  } else {
    actionText = `The Matrix has you...`;
  }

  return {
    description: actionText,
    outcome,
    prize: Number(outcome[4]) > 0 ? formatUnits(outcome[4], Number(decimals)) : '0',
    prizeType: Number(outcome[5]),
    receipt: result.receipt,
  };
};


export const getSupply = async (contractAddress: string, publicClient: PublicClient) => {

  const contract = {
      address: contractAddress,
      abi: degenGambitABI,
    } as const
    
    const totalSupply = await publicClient.readContract({
      ...contract,
      functionName: 'totalSupply',
      args: [],
    })
    
    return {
      value: totalSupply,
      formatted: formatUnits(totalSupply, 18),
      decimals: 18,
    }
}

export const getCurrentBlock = async (publicClient: PublicClient) => {
  const currentBlock = await publicClient.getBlockNumber();
  return {
    value: currentBlock,
    formatted: currentBlock.toString(),
    decimals: 0,
  };
};

export const getCostToSpin = async (contractAddress: string, degenAddress: string, publicClient: PublicClient) => {
  if (!degenAddress) return null;
  
  // Inline ABI for testing
  const inlineABI = [
    {
      "type": "function", 
      "name": "spinCost",
      "inputs": [{"name": "degenerate", "type": "address"}],
      "outputs": [{"name": "", "type": "uint256"}],
      "stateMutability": "view"
    }
  ] as const;
  
  const contract = {
    address: contractAddress,
    abi: inlineABI,
  } as const;
  
  const  spinCost = await publicClient.readContract({
      ...contract,
      functionName: 'spinCost',
      args: [degenAddress],
    });
  
  return {
    value: spinCost,
    formatted: formatUnits(spinCost, 18),
    decimals: 18,
  };
};

export const getHasPrize = async (contractAddress: string, degenAddress: string, publicClient: PublicClient) => {
  if (!degenAddress) return null;

  const contract = {
    address: contractAddress,
    abi: degenGambitABI,
  } as const;
  const hasPrize = await publicClient.readContract({
    ...contract,
    functionName: 'hasPrize',
    args: [degenAddress],
  });

  return hasPrize;
};

export const getCurrentDailyStreakLength = async (contractAddress: string, degenAddress: string, publicClient: PublicClient) => {
  if (!degenAddress) return null;

  const contract = {
    address: contractAddress,
    abi: degenGambitABI,
  } as const;
  const streak = await publicClient.readContract({
    ...contract,
    functionName: 'CurrentDailyStreakLength',
    args: [degenAddress],
  });

  return {
    value: streak,
    formatted: streak.toString(),
    decimals: 0,
  };
};

export const getCurrentWeeklyStreakLength = async (contractAddress: string, degenAddress: string, publicClient: PublicClient) => {
  if (!degenAddress) return null;

  const contract = {
    address: contractAddress,
    abi: degenGambitABI,
  } as const;
  const streak = await publicClient.readContract({
    ...contract,
    functionName: 'CurrentWeeklyStreakLength',
    args: [degenAddress],
  });

  return {
    value: streak,
    formatted: streak.toString(),
    decimals: 0,
  };
};

export const getBalanceOf = async (contractAddress: string, degenAddress: string, publicClient: PublicClient) => {
  if (!degenAddress) return null;
  const contract = {
    address: contractAddress,
    abi: degenGambitABI,
  } as const;

  const balance = await publicClient.readContract({
    ...contract,
    functionName: 'balanceOf',
    args: [degenAddress],
  });
  return {
    value: balance,
    formatted: formatUnits(balance, 18),
    decimals: 18,
  };
}

export const getLastSpinBlock = async (contractAddress: string, degenAddress: string, publicClient: PublicClient) => {
  if (!degenAddress) return null;

  const contract = {
    address: contractAddress,
    abi: degenGambitABI,
  } as const;
  const lastSpinBlock = await publicClient.readContract({
    ...contract,
    functionName: 'LastSpinBlock',
    args: [degenAddress],
  });

  return {
    value: lastSpinBlock,
    formatted: lastSpinBlock.toString(),
    decimals: 0,
  };
};

export const getBlocksToAct = async (contractAddress: string, publicClient: PublicClient) => {
  const viemContract = {
    address: contractAddress,
    abi: degenGambitABI,
  } as const;

  const blocksToAct = await publicClient.readContract({
    ...viemContract,
    functionName: 'BlocksToAct',
  });

  return {
    value: blocksToAct,
    formatted: blocksToAct.toString(),
    decimals: 0,
  };
};