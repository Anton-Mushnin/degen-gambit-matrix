import { contractAddress, viemG7Testnet, wagmiConfig } from '../config'
import { getPublicClient } from '@wagmi/core'
import { degenGambitABI } from '../ABIs/DegenGambit.abi.ts';
import { multicall } from '@wagmi/core';
import { createPublicClient, formatUnits, http, WalletClient } from 'viem';

// Define a more specific type for multicall results that matches the actual return type
type WagmiMulticallSuccessResult<T> = {
  status: "success";
  result: T;
};

export const getBalances = async (contractAddress: string, degenAddress: string) => {
    const nativeBalance = await getPublicClient(wagmiConfig).getBalance({
        address: degenAddress,
    })
    const contract = {
        address: contractAddress,
        abi: degenGambitABI,
      } as const
      const balanceInfo = await multicall(wagmiConfig, {
        contracts: [
            {
                ...contract,
                functionName: 'balanceOf',
                args: [degenAddress],
            },
            {
                ...contract,
                functionName: 'symbol',
            },
            {
                ...contract,
                functionName: 'decimals',
            },
        ],
      })
      
      // Filter for successful results only using a type guard that matches the actual return type
      const successResults = balanceInfo.filter(
        (item): item is WagmiMulticallSuccessResult<bigint | string | number> => 
          item.status === "success" && item.result !== undefined
      );
      
      if (successResults.length < 3) {
        throw new Error("Failed to get balance information");
      }
      
      const [
        balance,
        symbol,
        decimals,
      ] = successResults.map(item => item.result);

      return {
        balance: formatUnits(balance as bigint, decimals as number),
        nativeBalance: formatUnits(nativeBalance, wagmiConfig.chains[0].nativeCurrency.decimals),
        symbol,
      }
}

export const getStreaks = async (contractAddress: string, degenAddress: string) => {
    const contract = {
        address: contractAddress,
        abi: degenGambitABI,
      } as const
      const streakInfo = await multicall(wagmiConfig, {
        contracts: [
            {
                ...contract,
                functionName: 'CurrentDailyStreakLength',
                args: [degenAddress],
            },
            {
                ...contract,
                functionName: 'CurrentWeeklyStreakLength',
                args: [degenAddress],
            },
        ],
      })
      
      // Filter for successful results only using a type guard that matches the actual return type
      const successResults = streakInfo.filter(
        (item): item is WagmiMulticallSuccessResult<bigint> => 
          item.status === "success" && item.result !== undefined
      );
      
      if (successResults.length < 2) {
        throw new Error("Failed to get streak information");
      }
      
      const [
        dailyStreak,
        weeklyStreak,
      ] = successResults.map(item => item.result);

      return {
        dailyStreak: Number(dailyStreak),
        weeklyStreak: Number(weeklyStreak),
      }
}

export const getDegenGambitInfo = async (contractAddress: string) => {
    const contract = {
        address: contractAddress,
        abi: degenGambitABI,
      } as const


      
      const result = await multicall(wagmiConfig, {
        contracts: [
          {
            ...contract,
            functionName: 'BlocksToAct',
          },
          {
            ...contract,
            functionName: 'CostToRespin',
          },
          {
            ...contract,
            functionName: 'CostToSpin',
          },
          {
            ...contract,
            functionName: 'MajorGambitPrize',
          },
          {
            ...contract,
            functionName: 'MinorGambitPrize',
          },
          {
            ...contract,
            functionName: 'prizes',
          },
          {
            ...contract,
            functionName: 'symbol',
          },
        ],
      })
      return result
    }


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

// Remove unused variables
// const lastCheckedTimestamp = 0;
// const cachedBlockNumber = BigInt(0);

// Load contract constants once
async function loadContractConstants(contractAddress: string): Promise<typeof CONTRACT_CONSTANTS> {
  if (CONTRACT_CONSTANTS.loaded) return CONTRACT_CONSTANTS;
  
  const publicClient = getPublicClient(wagmiConfig);
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
async function _getLastSpinBlock(contractAddress: string, account: string, forceRefresh = false): Promise<number | null> {
  // Use cached value if available and not forcing refresh
  if (!forceRefresh && LAST_SPIN_BLOCKS[account] !== undefined) {
    return LAST_SPIN_BLOCKS[account];
  }
  
  const publicClient = getPublicClient(wagmiConfig);
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
export const updateLastSpinBlock = async (contractAddress: string, account: string) => {
  if (!account) return;
  
  // Force refresh the LastSpinBlock from the chain
  await _getLastSpinBlock(contractAddress, account, true);
  console.log(`Updated LastSpinBlock for ${account}`);
};

export const getBlockInfo = async (contractAddress: string, account: string, forceRefresh = false) => {
  if (!account) {
    console.error("No account provided to getBlockInfo");
    return null;
  }
  
  try {
    // Load constants if not already loaded
    const constants = await loadContractConstants(contractAddress);
    
    // Get last spin block (only value that changes per user)
    const lastSpinBlock = await _getLastSpinBlock(contractAddress, account, forceRefresh);
    if (lastSpinBlock === null) return null;
    
    // Get current block - the only value we need to check frequently
    const publicClient = getPublicClient(wagmiConfig);
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

export const _accept = async (contractAddress: string, client: WalletClient) => {
  
  const account = client.account;
  if (!account) {
    throw new Error("No account provided");
  }


  return client.writeContract({
    account,
    address: contractAddress,
    abi: degenGambitABI,
    functionName: 'accept',
    args: [],
    chain: viemG7Testnet,
  })
  

}

export const spin = async (contractAddress: string, boost: boolean, client: WalletClient) => {
  const account = client.account;
  if (!account) {
    throw new Error("No account provided");
  }

  const viemContract = {
    address: contractAddress,
    abi: degenGambitABI,
  } as const;
  
  const degenAddress = account.address ?? "";

  
  const publicClient = createPublicClient({
    chain: wagmiConfig.chains[0],
    transport: http()
  });

  const result = await multicall(wagmiConfig, {
    contracts: [
      {
        ...viemContract,
        functionName: 'symbol',
      },
      {
        ...viemContract,
        functionName: 'decimals',
      },
      {
        ...viemContract,
        functionName: 'spinCost',
        args: [degenAddress],
      },
    ],
  });

  const [
    decimals,
    spinCost,
  ] = result.filter(item => item.status === "success").map(item => item.result);

  const hash = await client.writeContract({
    account,
    address: contractAddress,
    value: typeof spinCost === 'bigint' ? spinCost : BigInt(0),
    abi: degenGambitABI,
    functionName: 'spin',
    args: [boost],
    chain: viemG7Testnet,
  })


  // After spin is confirmed, check the outcome
  let outcome: readonly bigint[] | null = null;
  let retries = 0;
  while (!outcome) {
    try {
      outcome = await publicClient.readContract({
        ...viemContract,
        functionName: 'inspectOutcome',
        args: [degenAddress],
      });
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      // Known errors that can occur while waiting for the outcome to be available
      const knownErrors = ['WaitForTick()', 'InvalidBlockNumber', '0xd5dc642d'];

      if (!knownErrors.some(err => errorMsg.includes(err))) {
        return { description: errorMsg };
      }
      retries += 1;
      if (retries > 30) {
        return { description: "Something went wrong. Please try again." };
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }


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
    receipt: hash,
  };
};


export const getSupply = async (contractAddress: string) => {

  const contract = {
      address: contractAddress,
      abi: degenGambitABI,
    } as const

    const publicClient = createPublicClient({
      chain: wagmiConfig.chains[0],
      transport: http()
    });
    
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

export const getCurrentBlock = async () => {
  const publicClient = getPublicClient(wagmiConfig);
  const currentBlock = await publicClient.getBlockNumber();
  return {
    value: currentBlock,
    formatted: currentBlock.toString(),
    decimals: 0,
  };
};

export const getCostToSpin = async (degenAddress: string) => {
  if (!degenAddress) return;
  
  const contract = {
    address: contractAddress,
    abi: degenGambitABI,
  } as const;

  const publicClient = getPublicClient(wagmiConfig);
  const spinCost = await publicClient.readContract({
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

export const getHasPrize = async (degenAddress: string) => {
  if (!degenAddress) return;

  const contract = {
    address: contractAddress,
    abi: degenGambitABI,
  } as const;

  const publicClient = getPublicClient(wagmiConfig);
  const hasPrize = await publicClient.readContract({
    ...contract,
    functionName: 'hasPrize',
    args: [degenAddress],
  });

  return hasPrize;
};

export const getCurrentDailyStreakLength = async (degenAddress: string) => {
  if (!degenAddress) return;

  const contract = {
    address: contractAddress,
    abi: degenGambitABI,
  } as const;

  const publicClient = getPublicClient(wagmiConfig);
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

export const getCurrentWeeklyStreakLength = async (degenAddress: string) => {
  if (!degenAddress) return;

  const contract = {
    address: contractAddress,
    abi: degenGambitABI,
  } as const;

  const publicClient = getPublicClient(wagmiConfig);
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

export const getLastSpinBlock = async (contractAddress: string, degenAddress: string) => {
  if (!degenAddress) return;

  const contract = {
    address: contractAddress,
    abi: degenGambitABI,
  } as const;

  const publicClient = getPublicClient(wagmiConfig);
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