import { PublicClient } from 'viem';
import { formatUnits } from 'viem';

// Define DiceStreak ABI (inline for now)
const diceStreakABI = [
  {
    "inputs": [],
    "name": "getBetAmount",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getPayoutMultiplier",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getBankBalance",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getBestCombo",
    "outputs": [
      {"internalType": "uint8[]", "name": "streakFaces", "type": "uint8[]"},
      {"internalType": "address", "name": "player", "type": "address"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "player", "type": "address"}],
    "name": "getPlayerStreak",
    "outputs": [{"internalType": "uint8[]", "name": "", "type": "uint8[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "player", "type": "address"}],
    "name": "getPlayerTotalWinnings",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "player", "type": "address"}],
    "name": "getGameStatus",
    "outputs": [{"internalType": "enum DiceStreak.GameStatus", "name": "", "type": "uint8"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "player", "type": "address"}],
    "name": "getLastBetResult",
    "outputs": [{"internalType": "enum DiceStreak.BetResult", "name": "", "type": "uint8"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint8", "name": "number", "type": "uint8"}],
    "name": "getStatistics",
    "outputs": [
      {"internalType": "uint256", "name": "occurrences", "type": "uint256"},
      {"internalType": "uint256", "name": "bets", "type": "uint256"},
      {"internalType": "uint256", "name": "wins", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// Read functions for DiceStreak contract

export const getBetAmount = async (contractAddress: string, publicClient: PublicClient) => {
  try {
    const betAmount = await publicClient.readContract({
      address: contractAddress,
      abi: diceStreakABI,
      functionName: 'getBetAmount',
    });

    return {
      value: betAmount,
      formatted: `${formatUnits(betAmount, 18)} ETH`,
      decimals: 18
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
      functionName: 'getPayoutMultiplier',
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
      functionName: 'getBankBalance',
    });

    return {
      value: balance,
      formatted: `${formatUnits(balance, 18)} ETH`,
      decimals: 18
    };
  } catch (error) {
    throw new Error(`Failed to get bank balance: ${error}`);
  }
};

export const getBestCombo = async (contractAddress: string, publicClient: PublicClient) => {
  try {
    const [streakFaces, player] = await publicClient.readContract({
      address: contractAddress,
      abi: diceStreakABI,
      functionName: 'getBestCombo',
    });

    return {
      streakFaces: streakFaces as number[],
      player: player as string,
      formatted: `${streakFaces.length} streak: ${streakFaces.join(', ')}`
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

    return {
      value: streak as number[],
      formatted: streak.length > 0 ? streak.join(', ') : 'No streak',
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
    });

    return {
      value: winnings,
      formatted: `${formatUnits(winnings, 18)} ETH`,
      decimals: 18
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
      functionName: 'getGameStatus',
      args: [playerAddress],
    });

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
      functionName: 'getLastBetResult',
      args: [playerAddress],
    });

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
    const [occurrences, bets, wins] = await publicClient.readContract({
      address: contractAddress,
      abi: diceStreakABI,
      functionName: 'getStatistics',
      args: [number],
    });

    return [String(number), String(occurrences), String(bets), String(wins)];
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
