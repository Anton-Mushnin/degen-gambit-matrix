import { viemG7Testnet, wagmiConfig } from '../config'
import { getPublicClient } from '@wagmi/core'
import { degenGambitABI } from '../ABIs/DegenGambit.abi.ts';
import { multicall } from '@wagmi/core';
import { createPublicClient, formatUnits, http } from 'viem';
import { Account } from 'thirdweb/wallets';
import { waitForReceipt } from 'thirdweb/transaction';
import { prepareContractCall, sendTransaction } from 'thirdweb/transaction';
import { viemAdapter } from 'thirdweb/adapters/viem';
import { ThirdwebClient } from 'thirdweb';


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
      const [
        balance,
        symbol,
        decimals,
      ] = balanceInfo.map((item: any) => item.result);

      return {
        balance: formatUnits(balance, decimals),
        nativeBalance: formatUnits(nativeBalance, wagmiConfig.chains[0].nativeCurrency.decimals),
        symbol,
      }
}


export const getStreaks = async (contractAddress: string, degenAddress: string) => {
    const contract = {
        address: contractAddress,
        abi: degenGambitABI,
      } as const
      const streaksInfo = await multicall(wagmiConfig, {
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
            {
                ...contract,
                functionName: 'LastStreakDay',
                args: [degenAddress],
            },
            {
                ...contract,
                functionName: 'LastStreakWeek',
                args: [degenAddress],
            },
        ],
      })
      const [
        dailyStreak,
        weeklyStreak,
        lastStreakDay,
        lastStreakWeek,
      ] = streaksInfo.map((item: any) => item.result);

      return {
        dailyStreak: Number(dailyStreak),
        weeklyStreak: Number(weeklyStreak),
        lastStreakDay: Number(lastStreakDay),
        lastStreakWeek: Number(lastStreakWeek),
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
// Force a fetch of new blocks
let lastCheckedTimestamp = 0;
let cachedBlockNumber = BigInt(0);

async function getLatestBlockNumber(client) {
  const now = Date.now();
  if (now - lastCheckedTimestamp > 10000) {
    try {
      cachedBlockNumber = await client.getBlockNumber();
      lastCheckedTimestamp = now;
      console.log(`NEW BLOCK: ${cachedBlockNumber}`);
    } catch (err) {
      console.error("Failed to get latest block:", err);
    }
  }
  return cachedBlockNumber;
}

export const getBlockInfo = async (contractAddress: string, account: string) => {
  const publicClient = getPublicClient(wagmiConfig);
  const viemContract = {
    address: contractAddress,
    abi: degenGambitABI,
  } as const;

  try {
    if (!account) {
      console.error("No account provided to getBlockInfo");
      return null;
    }
    
    const [blocksToAct, lastSpinBlock] = await Promise.all([
      publicClient.readContract({
        ...viemContract,
        functionName: 'BlocksToAct',
      }),
      publicClient.readContract({
        ...viemContract,
        functionName: 'LastSpinBlock',
        args: [account],
      }),
    ]);
    
    const currentBlock = await getLatestBlockNumber(publicClient);

    const blockDeadline = lastSpinBlock + blocksToAct;
    const blocksRemaining = blockDeadline > currentBlock ? Number(blockDeadline - currentBlock) : 0;

    const costToRespin = await publicClient.readContract({
      ...viemContract,
      functionName: 'CostToRespin',
    });

    console.log(`BLOCK INFO: Current=${currentBlock}, Last=${lastSpinBlock}, Deadline=${blockDeadline}, Remaining=${blocksRemaining}`);

    return {
      currentBlock,
      blocksToAct: Number(blocksToAct),
      lastSpinBlock: Number(lastSpinBlock),
      blockDeadline: Number(blockDeadline),
      blocksRemaining,
      costToRespin,
    };
  } catch (error) {
    console.error("Error getting block info:", error);
    return null;
  }
};

export const spin = async (contractAddress: string, boost: boolean, account: Account, client: ThirdwebClient) => {
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
    symbol,
    decimals,
    spinCost,
  ] = result.map((item: any) => item.result);

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
    value: spinCost,
  });

  const transactionResult = await sendTransaction({
    transaction: tx,
    account,
  });

  const receipt = await waitForReceipt(transactionResult);

  // Get current block info
  const blockInfo = await getBlockInfo(contractAddress, degenAddress);

  // After spin is confirmed, check the outcome
  let outcome;
  let retries = 0;
  while (!outcome) {
    try {
      outcome = await publicClient.readContract({
        ...viemContract,
        functionName: 'inspectOutcome',
        args: [degenAddress],
      });
    } catch (error: any) {
      const errorMsg = error.message || String(error);
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

  // Get respin cost for informational purposes
  const costToRespin = await publicClient.readContract({
    ...viemContract,
    functionName: 'CostToRespin',
  });

  let actionText = '';
  if (Number(outcome[4]) > 0) {
    actionText = `You won ${formatUnits(outcome[4], decimals)} ${Number(outcome[5]) === 1 ? wagmiConfig.chains[0].nativeCurrency.symbol : symbol}!`;
  } else {
    actionText = `The Matrix has you...`;
  }

  return {
    description: actionText,
    actionNeeded: `Type 'accept' to claim or 'respin' to try again (${blockInfo?.blocksRemaining || '?'} blocks remaining)`,
    outcome,
    blockInfo,
    pendingAcceptance: true,
    costToRespin: formatUnits(costToRespin, decimals),
    prize: Number(outcome[4]) > 0 ? formatUnits(outcome[4], decimals) : '0',
    prizeType: Number(outcome[5]),
    receipt,
  };
};

export const accept = async (contractAddress: string, account: Account, client: ThirdwebClient) => {
  const viemContract = {
    address: contractAddress,
    abi: degenGambitABI,
  } as const;

  const degenAddress = account.address ?? "";
  const publicClient = createPublicClient({
    chain: wagmiConfig.chains[0],
    transport: http()
  });

  try {
    // First check if we can get the outcome to see if there's something to accept
    let canAccept = false;
    try {
      const outcome = await publicClient.readContract({
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
      description: "Outcome accepted successfully!",
      success: true,
      receipt,
    };
  } catch (error: any) {
    const errorMsg = error.message || String(error);

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

export const respin = async (contractAddress: string, boost: boolean, account: Account, client: ThirdwebClient) => {
  // Respinning is the same as spinning, but we know it's within the deadline period
  // The contract will automatically use the CostToRespin price
  const spinResult = await spin(contractAddress, boost, account, client);
  
  // Add a note indicating this was a respin
  if (spinResult.description) {
    spinResult.description = "Respin: " + spinResult.description;
  }
  
  return spinResult;
}