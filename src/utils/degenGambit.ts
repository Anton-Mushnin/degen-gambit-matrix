import { viemG7Testnet, wagmiConfig } from '../config'
import { degenGambitABI } from '../ABIs/DegenGambit.abi.ts';
import { multicall } from '@wagmi/core';
import { formatUnits, WalletClient, PublicClient } from 'viem';
import { checkAndCreateBlockIfNeeded } from './blockProducer';
import { waitForReceipt } from 'thirdweb/transaction';
import { sendTransaction, prepareContractCall } from 'thirdweb/transaction';
import { Account } from 'thirdweb/wallets';

import { ThirdwebClient } from 'thirdweb';
import { viemAdapter } from 'thirdweb/adapters/viem';
import { degenGambitGame } from '../games/degen-gambit';

// Define a more specific type for multicall results that matches the actual return type
type WagmiMulticallSuccessResult<T> = {
  status: "success";
  result: T;
};


const degenGambitWagmiConfig = {
  ...wagmiConfig,
  chain: degenGambitGame.network,
};
export const getBalances = async (contractAddress: string, degenAddress: string, publicClient: PublicClient) => {
    const nativeBalance = await publicClient.getBalance({
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
      console.log('balanceInfo', balanceInfo);
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
      console.log('streakInfo', streakInfo);
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
      console.log('result', result);
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

    const contract = viemAdapter.contract.fromViem({
      viemContract: viemContract,
      chain: {
        ...viemG7Testnet,
        rpc: viemG7Testnet.rpcUrls["default"].http[0],
        blockExplorers: [{
          name: "Game7",
          url: viemG7Testnet.blockExplorers.default.url
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

export const accept = async (contractAddress: string, account: Account | undefined, client: WalletClient | ThirdwebClient, publicClient: PublicClient) => {
  if ('writeContract' in client) {
    const _account = client.account;
    if (!_account) {
      throw new Error("No account provided");
    }
    return _accept(contractAddress, client);
  } else if (account) {
    return _acceptThirdWebClient(contractAddress, account, client, publicClient);
  } else {
    throw new Error("No account provided");
  }
};

export const spin = async (contractAddress: string, boost: boolean, account: Account | undefined, client: WalletClient | ThirdwebClient, publicClient: PublicClient) => {

  // if (client instanceof WalletClient) {
  // const account = client.account;
  // if (!account) {
  //   throw new Error("No account provided");
  // }

  const viemContract = {
    address: contractAddress,
    abi: degenGambitABI,
  } as const;


  let degenAddress;


  if ('writeContract' in client) {
    const _account = client.account;
    degenAddress = _account?.address ?? "";
  } else {
    degenAddress = account?.address ?? "";
  }
  
  // const degenAddress = account.address ?? "";

  const result = await multicall(degenGambitWagmiConfig, {
    contracts: [
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

  console.log('spin', {result, wagmiConfig});



  

  const [
    decimals,
    spinCost,
  ] = result.filter(item => item.status === "success").map(item => item.result);

  let hash: string | null = null;
  if ('writeContract' in client) {
    const account = client.account;
    if (!account) {
        throw new Error("No account provided");
    }

    hash = await client.writeContract({
      account,
      address: contractAddress,
      value: typeof spinCost === 'bigint' ? spinCost : BigInt(0),
      abi: degenGambitABI,
      functionName: 'spin',
      args: [boost],
      chain: viemG7Testnet,
    })
  } else if (account) {
    const contract = viemAdapter.contract.fromViem({
      viemContract: viemContract,
      chain: {
        ...viemG7Testnet,
        rpc: viemG7Testnet.rpcUrls["default"].http[0],
        blockExplorers: [{
          name: "Game7",
          url: viemG7Testnet.blockExplorers.default.url
        }],
        testnet: true
      },
      client,
    });
  
    // Execute the spin
    const tx = prepareContractCall({
      contract,
      method: "spin",
      params: [boost],
      value: typeof spinCost === 'bigint' ? spinCost : BigInt(0),
    });
  
    const transactionResult = await sendTransaction({
      transaction: tx,
      account,
    });
  
    const receipt = await waitForReceipt(transactionResult);
    hash = receipt.transactionHash;
  }



  // After spin is confirmed, check the outcome
  let outcome: readonly bigint[] | null = null;
  let retries = 0;
  while (!outcome) {
    try {
      // Check if we need to create a new block before checking outcome
      const blockCheck = await checkAndCreateBlockIfNeeded(1);
      if (blockCheck.created) {
        console.log("Created a new block to help with outcome processing:", blockCheck.message);
      } else if (blockCheck.timeDiff !== undefined && blockCheck.timeDiff > 3) {
        console.log(`Latest block is ${blockCheck.timeDiff}s old, but no new block was created: ${blockCheck.message}`);
      }
      
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
        console.error("Unknown error while checking outcome:", errorMsg);
        return { description: errorMsg };
      }
      
      console.log(`Waiting for outcome, retry ${retries + 1}/30...`);
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
      "name": "symbol",
      "inputs": [],
      "outputs": [{"name": "", "type": "string"}],
      "stateMutability": "view"
    },
    {
      "type": "function", 
      "name": "spinCost",
      "inputs": [{"name": "degenerate", "type": "address"}],
      "outputs": [{"name": "", "type": "uint256"}],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "CostToSpin", 
      "inputs": [],
      "outputs": [{"name": "", "type": "uint256"}],
      "stateMutability": "view"
    }
  ] as const;
  
  const contract = {
    address: contractAddress,
    abi: inlineABI,
  } as const;
  
  console.log('getCostToSpin', {degenAddress, contractAddress, publicClient, contract});
  
  // First, test if the contract is responsive by calling a simple function
  try {
    const symbol = await publicClient.readContract({
      ...contract,
      functionName: 'symbol',
      args: [],
    });
    console.log('Contract is responsive, symbol:', symbol);
  } catch (contractError) {
    console.error('Contract is not responsive:', contractError);
    // Return a default cost if contract is not responsive
    return {
      value: BigInt(1000000000000000000), // 1 token default
      formatted: '1.0',
      decimals: 18,
    };
  }
  
  let spinCost: bigint;
  
  try {
    // Try the dynamic spinCost function first
    spinCost = await publicClient.readContract({
      ...contract,
      functionName: 'spinCost',
      args: [degenAddress],
    });
    console.log('getCostToSpin - dynamic cost:', {spinCost});
  } catch (error) {
    console.error('Error getting dynamic spinCost, trying fallback:', error);
    
    try {
      // Fallback to the constant CostToSpin function
      spinCost = await publicClient.readContract({
        ...contract,
        functionName: 'CostToSpin',
        args: [],
      });
      console.log('getCostToSpin - constant cost:', {spinCost});
    } catch (fallbackError) {
      console.error('Error getting constant CostToSpin:', fallbackError);
      // Return a default cost instead of throwing
      console.log('Using default cost due to contract function errors');
      return {
        value: BigInt(1000000000000000000), // 1 token default
        formatted: '1.0',
        decimals: 18,
      };
    }
  }
  
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