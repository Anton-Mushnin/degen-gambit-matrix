import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from "react";
import { getPublicClient } from '@wagmi/core';

// You'll need to import your contract ABI

import { g7Testnet, wagmiConfig } from '../../config/index.ts';
import { formatEther } from 'viem';
import { getDegenGambitInfo } from '@/utils/degenGambit.ts';
// import { getDegenGambitInfo } from '../utils/degenGambit.ts';


// Define a type for the contract call results
interface ContractCallResult {
  status: "success";
  result: bigint | string | readonly [readonly bigint[], readonly bigint[]];
}

export function useDegenGambitInfo(contractAddress: string) {

  const { data, isLoading, error } = useQuery({
    queryKey: ['degenGambitInfo', contractAddress],
    queryFn: () => getDegenGambitInfo(contractAddress),
  });

  const parseResults = useCallback(() => {
    if (!data) return null;

    // Type-safe way to handle the data
    const successResults = data.filter((item): item is ContractCallResult => 
      item.status === "success" && item.result !== undefined
    );
    
    if (successResults.length < 7) return null;

    const [
      blocksToAct,
      costToRespin,
      costToSpin,
      majorGambitPrize,
      minorGambitPrize,
      prizes,
      symbol,
    ] = successResults.map(item => item.result);

    // Type assertion for prizes which is a tuple of two arrays
    const prizesArray = prizes as readonly [readonly bigint[], readonly bigint[]];
    const prizesFormatted = prizesArray[0].map((prize: bigint, index: number) => 
      `${prizeDescriptions[index]}: ${formatEther(prize)} ${prizesArray[1][index] === 1n ? g7Testnet.nativeCurrency.symbol : 'GAMBIT'}`
    );

    const secondsToAct = Number(blocksToAct) * blockTime;

    return {
      blocksToAct: Number(blocksToAct),
      secondsToAct: Math.round(secondsToAct),
      costToRespin: `${costToRespin} WEI [TG7T]`,
      costToSpin: `${costToSpin} WEI [TG7T]`,
      majorGambitPrize: `${formatEther(majorGambitPrize as bigint)} GAMBIT`,
      minorGambitPrize: `${formatEther(minorGambitPrize as bigint)} GAMBIT`,
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
