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
import { DataItem } from '../types';
import { diceStreakGame } from '.';

export const privateKey = import.meta.env.VITE_PRIVATE_KEY;
export const privateKeyAddress = privateKey ? privateKeyToAccount(privateKey).address : undefined;


export const createContractData = ({
    publicClient,
    onDataUpdate,
}: {
    publicClient: PublicClient;
    onDataUpdate?: () => void;
}): DataItem[] => [
    {
        type: 'query',
        label: 'Bank Balance: ',
        queryKey: ['bankBalance', diceStreakGame.config.contractAddress as string],
        queryFn: () => getBankBalance(diceStreakGame.config.contractAddress as string, publicClient),
        onDataUpdate
    },
    {
        type: 'static',
        label: 'Contract Address: ',
        data: {
            formatted: (diceStreakGame.config.contractAddress as string).slice(0, 6) + '...' + (diceStreakGame.config.contractAddress as string).slice(-4),
            value: BigInt(0),
            decimals: 0
        },
        animation: false
    },
    {
        type: 'query',
        label: 'Bet Amount: ',
        queryKey: ['betAmount', diceStreakGame.config.contractAddress as string],
        queryFn: () => getBetAmount(diceStreakGame.config.contractAddress as string, publicClient),
        onDataUpdate
    },
    {
        type: 'query',
        label: 'Payout Multiplier: ',
        queryKey: ['payoutMultiplier', diceStreakGame.config.contractAddress as string],
        queryFn: () => getPayoutMultiplier(diceStreakGame.config.contractAddress as string, publicClient),
        onDataUpdate
    },
    {
        type: 'query',
        label: 'Best Combo: ',
        queryKey: ['bestCombo', diceStreakGame.config.contractAddress as string],
        queryFn: async () => {
            const combo = await getBestCombo(diceStreakGame.config.contractAddress as string, publicClient);
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
        queryKey: ['allStatistics', diceStreakGame.config.contractAddress as string],
        queryFn: async () => {
            const stats = await getAllStatistics(diceStreakGame.config.contractAddress as string, publicClient);
            const formatted = stats.map(stat => 
                `${stat.number}: ${stat.formatted}`
            ).join(' | ');
            return {
                value: BigInt(stats.length),
                formatted: formatted,
                decimals: 0
            };
        },
        onDataUpdate
    }
];

export const createPlayerData = ({
    publicClient,
    playerAddress,
    onDataUpdate,
}: {
    publicClient: PublicClient;
    playerAddress: string;
    onDataUpdate?: () => void;
}): DataItem[] => [
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
        queryKey: ['playerStreak', diceStreakGame.config.contractAddress as string, playerAddress],
        queryFn: async () => {
            const streak = await getPlayerStreak(diceStreakGame.config.contractAddress as string, playerAddress, publicClient);
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
        label: 'Total Winnings: ',
        queryKey: ['playerTotalWinnings', diceStreakGame.config.contractAddress as string, playerAddress],
        queryFn: () => getPlayerTotalWinnings(diceStreakGame.config.contractAddress as string, playerAddress, publicClient),
        onDataUpdate
    },
    {
        type: 'query',
        label: 'Game Status: ',
        queryKey: ['gameStatus', diceStreakGame.config.contractAddress as string, playerAddress],
        queryFn: async () => {
            const status = await getGameStatus(diceStreakGame.config.contractAddress as string, playerAddress, publicClient);
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
        queryKey: ['lastBetResult', diceStreakGame.config.contractAddress as string, playerAddress],
        queryFn: async () => {
            const result = await getLastBetResult(diceStreakGame.config.contractAddress as string, playerAddress, publicClient);
            return {
                value: BigInt(Number(result.value)),
                formatted: result.formatted,
                decimals: 0
            };
        },
        onDataUpdate
    }
];
