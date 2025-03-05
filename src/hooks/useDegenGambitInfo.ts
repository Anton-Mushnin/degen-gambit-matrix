import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from "react";
import { getPublicClient } from '@wagmi/core';

// You'll need to import your contract ABI

import { g7Testnet, wagmiConfig } from '../config/index.ts';
import { formatEther } from 'viem';
import { getDegenGambitInfo } from '../utils/degenGambit.ts';

type DegenGambitInfo = {
  blocksToAct: number;
  costToRespin: number;
  costToSpin: number;
  majorGambitPrize: number;
  minorGambitPrize: number;
  prizes: {
    prizesAmount: number[];
    typeOfPrize: number[];
  };
};

const calculateAverageBlockTime = async () => {
  const publicClient = getPublicClient(wagmiConfig);
  const currentBlock = await publicClient.getBlockNumber();
  const blocksToCheck = 10; // Get average from last 10 blocks
  
  const [oldBlock, newBlock] = await Promise.all([
    publicClient.getBlock({ blockNumber: currentBlock - BigInt(blocksToCheck) }),
    publicClient.getBlock({ blockNumber: currentBlock })
  ]);

  const timeDifference = Number(newBlock.timestamp - oldBlock.timestamp);
  return timeDifference / blocksToCheck; // Average seconds per block
};

export function useDegenGambitInfo(contractAddress: string) {
  const { data: blockTime } = useQuery({
    queryKey: ['averageBlockTime'],
    queryFn: calculateAverageBlockTime,
    // Cache the result for 5 minutes
    staleTime: 5 * 60 * 1000,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['degenGambitInfo', contractAddress],
    queryFn: () => getDegenGambitInfo(contractAddress),
  });

  const parseResults = useCallback(() => {
    if (!data || !blockTime) return null;

    const [
      blocksToAct,
      costToRespin,
      costToSpin,
      majorGambitPrize,
      minorGambitPrize,
      prizes,
      symbol,
    ] = data.map((item: any) => item.result);

    const prizesFormatted = prizes[0].map((prize: bigint, index: number) => `${prizeDescriptions[index]}: ${formatEther(prize)} ${prizes[1][index] === 1n ? g7Testnet.nativeCurrency.symbol : symbol}`)

    const secondsToAct = Number(blocksToAct) * blockTime;

    return {
      blocksToAct: Number(blocksToAct),
      secondsToAct: Math.round(secondsToAct),
      costToRespin: formatEther(costToRespin),
      costToSpin: formatEther(costToSpin),
      majorGambitPrize: formatEther(majorGambitPrize),
      minorGambitPrize: formatEther(minorGambitPrize),
      prizes: prizesFormatted,
      symbol,
    };
  }, [data, blockTime]);

  const parsedData = useMemo(() => parseResults(), [parseResults]);

  return {
    data: parsedData,
    isLoading,
    error,
  };
} 

    	// Selector: 11cceaf6
const prizeDescriptions = [
    "spinning at least 1 major symbol with no other prize option",
    "spinning matching minor left and right, with a different minor symbol",
    "spinning all matching minor symbols",
    "spinning matching minor symbol left and right, with a major symbol center",
    "spinning matching major symbol left and right, with a different major symbol center",
    "spinning 3 different major symbols",
    "spinning all matching major symbol"
];