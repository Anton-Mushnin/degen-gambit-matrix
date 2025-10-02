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
