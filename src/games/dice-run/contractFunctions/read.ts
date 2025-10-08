import { PublicClient } from 'viem';
import { formatEtherOrWei } from '../../../utils/formatting';
import { diceRunABI } from './DiceRun.abi';

// Read functions for DiceRun contract

export const getBetAmount = async (contractAddress: string, publicClient: PublicClient) => {
  try {
    const betAmount = await publicClient.readContract({
      address: contractAddress,
      abi: diceRunABI,
      functionName: 'getBetAmount',
    });

    const formatted = formatEtherOrWei(betAmount, 0.00001);
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
    const [basicPayout, bankContribution] = await publicClient.readContract({
      address: contractAddress,
      abi: diceRunABI,
      functionName: 'getPayoutCalculation',
    });

    const totalPayout = basicPayout - bankContribution;
    const formatted = formatEtherOrWei(totalPayout, 0.00001);

    return {
      value: totalPayout,
      formatted: `${formatted.formatted} (basic: ${formatEtherOrWei(basicPayout, 0.00001).formatted}, bank contrib: ${formatEtherOrWei(bankContribution, 0.00001).formatted})`,
      decimals: formatted.decimals
    };
  } catch (error) {
    throw new Error(`Failed to get payout calculation: ${error}`);
  }
};

export const getStreakBankSharePercentages = async (contractAddress: string, publicClient: PublicClient) => {
  try {
    const percentages = await publicClient.readContract({
      address: contractAddress,
      abi: diceRunABI,
      functionName: 'getStreakBankSharePercentages',
    });

    return percentages.map((percentage, index) => [
      String(index + 3), // streak length (3, 4, 5, 6)
      `${Number(percentage) / 100}%` // convert to percentage
    ]);
  } catch (error) {
    throw new Error(`Failed to get streak bank share percentages: ${error}`);
  }
};

export const getInvestmentFeePercent = async (contractAddress: string, publicClient: PublicClient) => {
  try {
    const feePercent = await publicClient.readContract({
      address: contractAddress,
      abi: diceRunABI,
      functionName: 'getInvestmentFeePercent',
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
      address: contractAddress,
      abi: diceRunABI,
      functionName: 'getBankBalance',
    });

    const formatted = formatEtherOrWei(balance, 0.00001);
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
    const bestStreak = await publicClient.readContract({
      address: contractAddress,
      abi: diceRunABI,
      functionName: 'getBestStreak',
    });

    return {
      value: bestStreak,
      formatted: String(bestStreak),
      decimals: 0
    };
  } catch (error) {
    throw new Error(`Failed to get best streak: ${error}`);
  }
};

export const getDiceStatistics = async (contractAddress: string, publicClient: PublicClient) => {
  try {
    const stats = await Promise.all([
      getStatisticsForDice(contractAddress, 1, publicClient),
      getStatisticsForDice(contractAddress, 2, publicClient),
      getStatisticsForDice(contractAddress, 3, publicClient),
      getStatisticsForDice(contractAddress, 4, publicClient),
      getStatisticsForDice(contractAddress, 5, publicClient),
      getStatisticsForDice(contractAddress, 6, publicClient),
    ]);

    return stats;
  } catch (error) {
    throw new Error(`Failed to get dice statistics: ${error}`);
  }
};

const getStatisticsForDice = async (contractAddress: string, diceNumber: number, publicClient: PublicClient) => {
  try {
    const [occurrences, bets, wins] = await publicClient.readContract({
      address: contractAddress,
      abi: diceRunABI,
      functionName: 'getDiceStatistics',
      args: [diceNumber],
    });

    return [String(diceNumber), String(occurrences), String(bets), String(wins)];
  } catch (error) {
    throw new Error(`Failed to get statistics for dice ${diceNumber}: ${error}`);
  }
};

export const getAmountInvested = async (contractAddress: string, playerAddress: string, publicClient: PublicClient) => {
  try {
    const amountInvested = await publicClient.readContract({
      address: contractAddress,
      abi: diceRunABI,
      functionName: 'getAmountInvested',
      args: [playerAddress],
    });

    const formatted = formatEtherOrWei(amountInvested, 0.00001);
    return {
      value: amountInvested,
      formatted: formatted.formatted,
      decimals: formatted.decimals
    };
  } catch (error) {
    throw new Error(`Failed to get amount invested: ${error}`);
  }
};

export const getSharePercentage = async (contractAddress: string, playerAddress: string, publicClient: PublicClient) => {
  try {
    const sharePercentage = await publicClient.readContract({
      address: contractAddress,
      abi: diceRunABI,
      functionName: 'getSharePercentage',
      args: [playerAddress],
    });

    return {
      value: sharePercentage,
      formatted: `${Number(sharePercentage) / 100}%`,
      decimals: 0
    };
  } catch (error) {
    throw new Error(`Failed to get share percentage: ${error}`);
  }
};

export const getShareChange = async (contractAddress: string, playerAddress: string, publicClient: PublicClient) => {
  try {
    const shareChange = await publicClient.readContract({
      address: contractAddress,
      abi: diceRunABI,
      functionName: 'getShareChange',
      args: [playerAddress],
    });

    const changeValue = Number(shareChange);
    const sign = changeValue >= 0 ? '+' : '';
    const formatted = `${sign}${changeValue / 100}%`;

    return {
      value: shareChange,
      formatted: formatted,
      decimals: 0
    };
  } catch (error) {
    throw new Error(`Failed to get share change: ${error}`);
  }
};

export const getPlayerTotalWinnings = async (contractAddress: string, playerAddress: string, publicClient: PublicClient) => {
  try {
    const totalWinnings = await publicClient.readContract({
      address: contractAddress,
      abi: diceRunABI,
      functionName: 'getPlayerTotalWinnings',
      args: [playerAddress],
    });

    const formatted = formatEtherOrWei(totalWinnings, 0.00001);
    return {
      value: totalWinnings,
      formatted: formatted.formatted,
      decimals: formatted.decimals
    };
  } catch (error) {
    throw new Error(`Failed to get player total winnings: ${error}`);
  }
};

export const getPlayerCurrentStreak = async (contractAddress: string, playerAddress: string, publicClient: PublicClient) => {
  try {
    const currentStreak = await publicClient.readContract({
      address: contractAddress,
      abi: diceRunABI,
      functionName: 'getPlayerCurrentStreak',
      args: [playerAddress],
    });

    return {
      value: currentStreak,
      formatted: String(currentStreak),
      decimals: 0
    };
  } catch (error) {
    throw new Error(`Failed to get player current streak: ${error}`);
  }
};

export const getNextNeededDiceNumber = async (contractAddress: string, playerAddress: string, publicClient: PublicClient) => {
  try {
    const nextNumber = await publicClient.readContract({
      address: contractAddress,
      abi: diceRunABI,
      functionName: 'getNextNeededDiceNumber',
      args: [playerAddress],
    });

    return {
      value: nextNumber,
      formatted: nextNumber > 0 ? String(nextNumber) : 'None',
      decimals: 0
    };
  } catch (error) {
    throw new Error(`Failed to get next needed dice number: ${error}`);
  }
};

export const getPotentialBonusAmount = async (contractAddress: string, playerAddress: string, publicClient: PublicClient) => {
  try {
    const bonusAmount = await publicClient.readContract({
      address: contractAddress,
      abi: diceRunABI,
      functionName: 'getPotentialBonusAmount',
      args: [playerAddress],
    });

    const formatted = formatEtherOrWei(bonusAmount, 0.00001);
    return {
      value: bonusAmount,
      formatted: bonusAmount > 0 ? formatted.formatted : 'No bonus available',
      decimals: bonusAmount > 0 ? formatted.decimals : 0
    };
  } catch (error) {
    throw new Error(`Failed to get potential bonus amount: ${error}`);
  }
};
