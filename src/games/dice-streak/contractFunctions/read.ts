import { PublicClient } from 'viem';
import { formatEtherOrWei } from '@/utils/formatting';
import { diceStreakABI } from './DiceStreak.abi';




// Read functions for DiceStreak contract

export const getBetAmount = async (contractAddress: string, publicClient: PublicClient) => {
  try {
    const betAmount = await publicClient.readContract({
      address: contractAddress,
      abi: diceStreakABI,
      functionName: 'getBetAmount',
    });

    const formatted = formatEtherOrWei(betAmount);
    return {
      value: betAmount,
      formatted: formatted.formatted,
      decimals: formatted.decimals
    };
  } catch (error) {
    throw new Error(`Failed to get bet amount: ${error}`);
  }
};

export const getPayoutMultiplier = async (contractAddress: string, publicClient: PublicClient) => {
  try {
    const multiplier = await publicClient.readContract({
      address: contractAddress,
      abi: diceStreakABI,
      functionName: 'payoutMultiplier',
    });

    return {
      value: multiplier,
      formatted: `${Number(multiplier) / 1000}x`,
      decimals: 0
    };
  } catch (error) {
    throw new Error(`Failed to get payout multiplier: ${error}`);
  }
};

export const getBankBalance = async (contractAddress: string, publicClient: PublicClient) => {
  try {
    const balance = await publicClient.readContract({
      address: contractAddress,
      abi: diceStreakABI,
      functionName: 'getBetAmount',
    }) as bigint;

    const formatted = formatEtherOrWei(balance);
    return {
      value: balance,
      formatted: formatted.formatted,
      decimals: formatted.decimals
    };
  } catch (error) {
    throw new Error(`Failed to get bank balance: ${error}`);
  }
};

export const getBestCombo = async (contractAddress: string, publicClient: PublicClient, playerAddress: string) => {
  try {
    const streakFaces = await publicClient.readContract({
      address: contractAddress,
      abi: diceStreakABI,
      functionName: 'getPlayerStreak',
      args: [playerAddress],
    }) as readonly [number, number, number, number, number];

    return {
      streakFaces: Array.from(streakFaces) as number[],
      player: playerAddress,
      formatted: `${streakFaces.length} streak: ${Array.from(streakFaces).join(', ')}`
    };
  } catch (error) {
    throw new Error(`Failed to get best combo: ${error}`);
  }
};

export const getPlayerStreak = async (contractAddress: string, playerAddress: string, publicClient: PublicClient) => {
  try {
    const streak = await publicClient.readContract({
      address: contractAddress,
      abi: diceStreakABI,
      functionName: 'getPlayerStreak',
      args: [playerAddress],
    });

    const streakArray = Array.from(streak as readonly [number, number, number, number, number]);
    return {
      value: streakArray,
      formatted: streakArray.length > 0 ? streakArray.join(', ') : 'No streak',
      decimals: 0
    };
  } catch (error) {
    throw new Error(`Failed to get player streak: ${error}`);
  }
};

export const getPlayerTotalWinnings = async (contractAddress: string, playerAddress: string, publicClient: PublicClient) => {
  try {
    const winnings = await publicClient.readContract({
      address: contractAddress,
      abi: diceStreakABI,
      functionName: 'getPlayerTotalWinnings',
      args: [playerAddress],
    }) as bigint;

    const formatted = formatEtherOrWei(winnings);
    return {
      value: winnings,
      formatted: formatted.formatted,
      decimals: formatted.decimals
    };
  } catch (error) {
    throw new Error(`Failed to get player total winnings: ${error}`);
  }
};

export const getGameStatus = async (contractAddress: string, playerAddress: string, publicClient: PublicClient) => {
  try {
    const status = await publicClient.readContract({
      address: contractAddress,
      abi: diceStreakABI,
      functionName: 'getPlayerGameStatus',
      args: [playerAddress],
    }) as number;

    const statusMap = ['Dice Ready', 'Rolling', 'Claiming'];
    const statusText = statusMap[Number(status)] || 'Unknown';

    return {
      value: Number(status),
      formatted: statusText,
      decimals: 0
    };
  } catch (error) {
    throw new Error(`Failed to get game status: ${error}`);
  }
};

export const getLastBetResult = async (contractAddress: string, playerAddress: string, publicClient: PublicClient) => {
  try {
    const result = await publicClient.readContract({
      address: contractAddress,
      abi: diceStreakABI,
      functionName: 'getPlayerGameStatus',
      args: [playerAddress],
    }) as number;

    const resultMap = ['None', 'Win', 'Loss'];
    const resultText = resultMap[Number(result)] || 'Unknown';

    return {
      value: Number(result),
      formatted: resultText,
      decimals: 0
    };
  } catch (error) {
    throw new Error(`Failed to get last bet result: ${error}`);
  }
};

export const getStatistics = async (contractAddress: string, number: number, publicClient: PublicClient) => {
  try {
    const stats = await publicClient.readContract({
      address: contractAddress,
      abi: diceStreakABI,
      functionName: 'getStatistics',
    }) as readonly [{ bets: bigint; wins: bigint; }, { bets: bigint; wins: bigint; }, { bets: bigint; wins: bigint; }, { bets: bigint; wins: bigint; }, { bets: bigint; wins: bigint; }, { bets: bigint; wins: bigint; }];

    const stat = stats[number - 1]; // Convert 1-based to 0-based index
    return [String(number), "0", String(stat.bets), String(stat.wins)];
  } catch (error) {
    throw new Error(`Failed to get statistics: ${error}`);
  }
};

export const getAllStatistics = async (contractAddress: string, publicClient: PublicClient) => {
  try {
    const stats = await Promise.all([
      getStatistics(contractAddress, 1, publicClient),
      getStatistics(contractAddress, 2, publicClient),
      getStatistics(contractAddress, 3, publicClient),
      getStatistics(contractAddress, 4, publicClient),
      getStatistics(contractAddress, 5, publicClient),
      getStatistics(contractAddress, 6, publicClient),
    ]);

    return stats;
  } catch (error) {
    throw new Error(`Failed to get all statistics: ${error}`);
  }
};

export const getPrizeToClaim = async (contractAddress: string, playerAddress: string, publicClient: PublicClient) => {
  try {
    const prizeValue = await publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: diceStreakABI,
      functionName: 'inspectOutcome',
      args: [playerAddress],
    }) as [bigint, any];

    const prizeAmount = prizeValue[0];

    return {
      value: prizeAmount,
      formatted: prizeAmount > 0 ? `${formatEtherOrWei(prizeAmount).formatted}` : 'No prize to claim',
      decimals: prizeAmount > 0 ? 18 : 0
    };
  } catch (error) {
    throw new Error(`Failed to get prize to claim: ${error}`);
  }
};
