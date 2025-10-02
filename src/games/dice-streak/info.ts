import { getBalance } from '@wagmi/core';
import { privateKeyToAccount } from 'viem/accounts';
import { PublicClient } from 'viem';

import { wagmiConfig } from '../../config';
import {
    getBetAmount,
    getPayoutMultiplier,
    getBankBalance,
    getBestCombo,
    getPlayerStreak,
    getPlayerTotalWinnings,
    getGameStatus,
    getLastBetResult,
    getAllStatistics
} from './contractFunctions/read';
import { formatUnits } from 'viem';
import { DataItem } from '../types';
import { diceStreakGame } from '.';

export const privateKey = import.meta.env.VITE_PRIVATE_KEY;
export const privateKeyAddress = privateKey ? privateKeyToAccount(privateKey).address : undefined;

// Combo detection and calculation logic (mirroring contract logic)
const detectCombo = (numbers: number[]): { isCombo: boolean; comboType: string } => {
    if (numbers.length < 3) {
        return { isCombo: false, comboType: '' };
    }

    // Check all equal
    const allEqual = numbers.every(num => num === numbers[0]);
    if (allEqual) {
        return { isCombo: true, comboType: 'All Equal' };
    }

    // Check increasing sequence
    const increasing = numbers.every((num, index) =>
        index === 0 || num === numbers[index - 1] + 1
    );
    if (increasing) {
        return { isCombo: true, comboType: 'Increasing' };
    }

    // Check decreasing sequence
    const decreasing = numbers.every((num, index) =>
        index === 0 || num === numbers[index - 1] - 1
    );
    if (decreasing) {
        return { isCombo: true, comboType: 'Decreasing' };
    }

    return { isCombo: false, comboType: '' };
};

const getBankShare = (streakLength: number): number => {
    if (streakLength === 3) return 200; // 2%
    if (streakLength === 4) return 500; // 5%
    if (streakLength === 5) return 1500; // 15%
    if (streakLength === 6) return 5000; // 50%
    return 0;
};

const checkComboPossibility = (currentStreak: number[], bankBalance: bigint): {
    possibleNumbers: number[];
    nextPayout: bigint;
    comboType: string;
} => {
    if (currentStreak.length === 0) {
        return { possibleNumbers: [], nextPayout: BigInt(0), comboType: '' };
    }

    const possibleNumbers: number[] = [];
    let maxPayout = BigInt(0);
    let bestComboType = '';

    // Try each possible next number (1-6)
    for (let nextNum = 1; nextNum <= 6; nextNum++) {
        const testStreak = [...currentStreak, nextNum];
        const newLength = testStreak.length;

        // Check if this creates a combo of length 3 or more
        for (let comboLength = 3; comboLength <= newLength; comboLength++) {
            const lastNumbers = testStreak.slice(-comboLength);
            const { isCombo, comboType } = detectCombo(lastNumbers);

            if (isCombo) {
                const bankShare = getBankShare(comboLength);
                const bonus = (bankBalance * BigInt(bankShare)) / BigInt(10000);

                if (bonus > maxPayout) {
                    maxPayout = bonus;
                    bestComboType = comboType;
                }

                possibleNumbers.push(nextNum);
                break; // Found a combo for this number
            }
        }
    }

    return {
        possibleNumbers: [...new Set(possibleNumbers)], // Remove duplicates
        nextPayout: maxPayout,
        comboType: bestComboType
    };
};


export const createContractData = ({
    publicClient,
    contractAddress,
    onDataUpdate,
}: {
    publicClient: PublicClient;
    contractAddress?: string;
    onDataUpdate?: () => void;
}): DataItem[] => {
    const address: string = contractAddress || (diceStreakGame.config.contractAddress as string);
    return [
    {
        type: 'query',
        label: 'Bank Balance: ',
        queryKey: ['bankBalance', address],
        queryFn: () => getBankBalance(address, publicClient),
        onDataUpdate
    },
    {
        type: 'static',
        label: 'Contract Address: ',
        data: {
            formatted: address.slice(0, 6) + '...' + address.slice(-4),
            value: BigInt(0),
            decimals: 0
        },
        animation: false
    },
    {
        type: 'query',
        label: 'Bet Amount: ',
        queryKey: ['betAmount', address],
        queryFn: () => getBetAmount(address, publicClient),
        onDataUpdate
    },
    {
        type: 'query',
        label: 'Payout Multiplier: ',
        queryKey: ['payoutMultiplier', address],
        queryFn: () => getPayoutMultiplier(address, publicClient),
        onDataUpdate
    },
    {
        type: 'query',
        label: 'Best Combo: ',
        queryKey: ['bestCombo', address],
        queryFn: async () => {
            const combo = await getBestCombo(address, publicClient);
            return {
                value: BigInt(combo.streakFaces.length),
                formatted: combo.formatted,
                decimals: 0
            };
        },
        onDataUpdate
    },
    {
        type: 'query',
        label: 'Statistics: ',
        animation: false,
        headers: ['Number', 'Occurrences', 'Bets', 'Wins'],
        isTable: true,
        queryKey: ['allStatistics', address],
        tableQueryFn: async () => {
            return  getAllStatistics(address, publicClient);
        },
        onDataUpdate
    }
];
};

export const createPlayerData = ({
    publicClient,
    playerAddress,
    contractAddress,
    onDataUpdate,
}: {
    publicClient: PublicClient;
    playerAddress: string;
    contractAddress?: string;
    onDataUpdate?: () => void;
}): DataItem[] => {
    const address: string = contractAddress || (diceStreakGame.config.contractAddress as string);
    return [
    {
        type: 'static',
        label: 'Player Address: ',
        data: {
            formatted: playerAddress.slice(0, 6) + '...' + playerAddress.slice(-4),
            value: BigInt(0),
            decimals: 0
        },
        animation: false
    },
    {
        type: 'query',
        label: 'Player Balance: ',
        queryKey: ['playerBalance', playerAddress],
        queryFn: () => getBalance(wagmiConfig, {address: playerAddress, chainId: diceStreakGame.network.id as any}),
        onDataUpdate
    },
    {
        type: 'query',
        label: 'Current Streak: ',
        queryKey: ['playerStreak', address, playerAddress],
        queryFn: async () => {
            const streak = await getPlayerStreak(address, playerAddress, publicClient);
            return {
                value: BigInt(streak.value.length),
                formatted: streak.formatted,
                decimals: 0
            };
        },
        onDataUpdate
    },
    {
        type: 'query',
        label: 'Combo Possibility: ',
        queryKey: ['comboPossibility', address, playerAddress],
        queryFn: async () => {
            const [streak, bankBalance] = await Promise.all([
                getPlayerStreak(address, playerAddress, publicClient),
                getBankBalance(address, publicClient)
            ]);

            const comboInfo = checkComboPossibility(streak.value, bankBalance.value);

            if (comboInfo.possibleNumbers.length === 0) {
                return {
                    value: BigInt(0),
                    formatted: 'No combo possible',
                    decimals: 0
                };
            }

            const numbers = comboInfo.possibleNumbers.join(', ');
            const payout = comboInfo.nextPayout > BigInt(0)
                ? ` → ${formatUnits(comboInfo.nextPayout, 18)} ETH bonus`
                : '';

            return {
                value: BigInt(comboInfo.possibleNumbers.length),
                formatted: `Roll ${numbers}${payout}`,
                decimals: 0
            };
        },
        onDataUpdate
    },
    {
        type: 'query',
        label: 'Total Winnings: ',
        queryKey: ['playerTotalWinnings', address, playerAddress],
        queryFn: () => getPlayerTotalWinnings(address, playerAddress, publicClient),
        onDataUpdate
    },
    {
        type: 'query',
        label: 'Game Status: ',
        queryKey: ['gameStatus', address, playerAddress],
        queryFn: async () => {
            const status = await getGameStatus(address, playerAddress, publicClient);
            return {
                value: BigInt(Number(status.value)),
                formatted: status.formatted,
                decimals: 0
            };
        },
        onDataUpdate
    },
    {
        type: 'query',
        label: 'Last Bet Result: ',
        queryKey: ['lastBetResult', address, playerAddress],
        queryFn: async () => {
            const result = await getLastBetResult(address, playerAddress, publicClient);
            return {
                value: BigInt(Number(result.value)),
                formatted: result.formatted,
                decimals: 0
            };
        },
        onDataUpdate
    }
];
};
