import { PublicClient } from 'viem';
import { formatEtherOrWei } from '../../../utils/formatting';
// TODO: Import actual ABI when contract is implemented
// import { diceRunABI } from '../../../ABIs/DiceRun.abi';

// Placeholder ABI - will be replaced with actual contract ABI
const diceRunABI = [] as const;

// Read functions for DiceRun contract

export const getBetAmount = async (contractAddress: string, publicClient: PublicClient) => {
  try {
    const betAmount = await publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: diceRunABI,
      functionName: 'betAmount',
    });

    const formatted = formatEtherOrWei(betAmount as bigint);
    return {
      value: betAmount,
      formatted: formatted.formatted,
      decimals: formatted.decimals
    };
  } catch (error) {
    throw new Error(`Failed to get bet amount: ${error}`);
  }
};

export const getPayoutCalculation = async (contractAddress: string, publicClient: PublicClient) => {
  try {
    const [basicPayoutMultiplier, bankContribution] = await publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: diceRunABI,
      functionName: 'getPayoutParameters',
    });

    const payout = (Number(basicPayoutMultiplier) / 100) - (Number(bankContribution) / 100);
    return {
      value: BigInt(Math.floor(payout * 100)),
      formatted: `${payout}x`,
      decimals: 0
    };
  } catch (error) {
    throw new Error(`Failed to get payout calculation: ${error}`);
  }
};

export const getStreakBankSharePercentages = async (contractAddress: string, publicClient: PublicClient) => {
  try {
    const shares = await publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: diceRunABI,
      functionName: 'getStreakBankShares',
    });

    const data = (shares as bigint[]).map((share, index) => [
      String(index + 3), // streak length (3, 4, 5, 6)
      `${Number(share) / 100}%`
    ]);

    return data;
  } catch (error) {
    throw new Error(`Failed to get streak bank share percentages: ${error}`);
  }
};

export const getInvestmentFeePercent = async (contractAddress: string, publicClient: PublicClient) => {
  try {
    const feePercent = await publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: diceRunABI,
      functionName: 'investmentFeePercent',
    });

    return {
      value: feePercent,
      formatted: `${Number(feePercent) / 100}%`,
      decimals: 0
    };
  } catch (error) {
    throw new Error(`Failed to get investment fee percent: ${error}`);
  }
};

export const getBankBalance = async (contractAddress: string, publicClient: PublicClient) => {
  try {
    const balance = await publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: diceRunABI,
      functionName: 'getBankBalance',
    });

    const formatted = formatEtherOrWei(balance as bigint);
    return {
      value: balance,
      formatted: formatted.formatted,
      decimals: formatted.decimals
    };
  } catch (error) {
    throw new Error(`Failed to get bank balance: ${error}`);
  }
};

export const getBestStreak = async (contractAddress: string, publicClient: PublicClient) => {
  try {
    const [length, player] = await publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: diceRunABI,
      functionName: 'getBestStreak',
    });

    return {
      value: length,
      formatted: `${length} (${player.slice(0, 6)}...${player.slice(-4)})`,
      decimals: 0
    };
  } catch (error) {
    throw new Error(`Failed to get best streak: ${error}`);
  }
};

export const getDiceStatistics = async (contractAddress: string, publicClient: PublicClient) => {
  try {
    const stats = await Promise.all([
      getDiceStatsForNumber(contractAddress, 1, publicClient),
      getDiceStatsForNumber(contractAddress, 2, publicClient),
      getDiceStatsForNumber(contractAddress, 3, publicClient),
      getDiceStatsForNumber(contractAddress, 4, publicClient),
      getDiceStatsForNumber(contractAddress, 5, publicClient),
      getDiceStatsForNumber(contractAddress, 6, publicClient),
    ]);

    return stats;
  } catch (error) {
    throw new Error(`Failed to get dice statistics: ${error}`);
  }
};

const getDiceStatsForNumber = async (contractAddress: string, number: number, publicClient: PublicClient) => {
  try {
    const [occurrences, bets, wins] = await publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: diceRunABI,
      functionName: 'getDiceStats',
      args: [number],
    });

    return [String(number), String(occurrences), String(bets), String(wins)];
  } catch (error) {
    throw new Error(`Failed to get dice stats for number ${number}: ${error}`);
  }
};

export const getAmountInvested = async (contractAddress: string, playerAddress: string, publicClient: PublicClient) => {
  try {
    const amount = await publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: diceRunABI,
      functionName: 'getAmountInvested',
      args: [playerAddress],
    });

    const formatted = formatEtherOrWei(amount as bigint);
    return {
      value: amount,
      formatted: formatted.formatted,
      decimals: formatted.decimals
    };
  } catch (error) {
    throw new Error(`Failed to get amount invested: ${error}`);
  }
};

export const getSharePercentage = async (contractAddress: string, playerAddress: string, publicClient: PublicClient) => {
  try {
    const percentage = await publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: diceRunABI,
      functionName: 'getSharePercentage',
      args: [playerAddress],
    });

    return {
      value: percentage,
      formatted: `${Number(percentage) / 100}%`,
      decimals: 0
    };
  } catch (error) {
    throw new Error(`Failed to get share percentage: ${error}`);
  }
};

export const getShareChange = async (contractAddress: string, playerAddress: string, publicClient: PublicClient) => {
  try {
    const change = await publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: diceRunABI,
      functionName: 'getShareChange',
      args: [playerAddress],
    });

    const formatted = formatEtherOrWei(change as bigint);
    return {
      value: change,
      formatted: formatted.formatted,
      decimals: formatted.decimals
    };
  } catch (error) {
    throw new Error(`Failed to get share change: ${error}`);
  }
};

export const getPlayerTotalWinnings = async (contractAddress: string, playerAddress: string, publicClient: PublicClient) => {
  try {
    const winnings = await publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: diceRunABI,
      functionName: 'getPlayerTotalWinnings',
      args: [playerAddress],
    });

    const formatted = formatEtherOrWei(winnings as bigint);
    return {
      value: winnings,
      formatted: formatted.formatted,
      decimals: formatted.decimals
    };
  } catch (error) {
    throw new Error(`Failed to get player total winnings: ${error}`);
  }
};

export const getPlayerCurrentStreak = async (contractAddress: string, playerAddress: string, publicClient: PublicClient) => {
  try {
    const streak = await publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: diceRunABI,
      functionName: 'getPlayerCurrentStreak',
      args: [playerAddress],
    });

    return {
      value: streak,
      formatted: String(streak),
      decimals: 0
    };
  } catch (error) {
    throw new Error(`Failed to get player current streak: ${error}`);
  }
};

export const getNextNeededDiceNumber = async (contractAddress: string, playerAddress: string, publicClient: PublicClient) => {
  try {
    const nextNumber = await publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: diceRunABI,
      functionName: 'getNextNeededDiceNumber',
      args: [playerAddress],
    });

    return {
      value: nextNumber,
      formatted: String(nextNumber),
      decimals: 0
    };
  } catch (error) {
    throw new Error(`Failed to get next needed dice number: ${error}`);
  }
};

export const getPotentialBonusAmount = async (contractAddress: string, playerAddress: string, publicClient: PublicClient) => {
  try {
    const bonus = await publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: diceRunABI,
      functionName: 'getPotentialBonusAmount',
      args: [playerAddress],
    });

    const formatted = formatEtherOrWei(bonus as bigint);
    return {
      value: bonus,
      formatted: formatted.formatted,
      decimals: formatted.decimals
    };
  } catch (error) {
    throw new Error(`Failed to get potential bonus amount: ${error}`);
  }
};
