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

export const privateKey = import.meta.env.VITE_PRIVATE_KEY;
export const privateKeyAddress = privateKey ? privateKeyToAccount(privateKey).address : undefined;

// Contract address from deployment
const CONTRACT_ADDRESS = '0x73380E6f3C2f9d3811f6Ab13A6623906ecFCa9AD';
const NETWORK_ID = 37714555429; // XAI Testnet

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
        queryKey: ['bankBalance', CONTRACT_ADDRESS],
        queryFn: () => getBankBalance(CONTRACT_ADDRESS, publicClient),
        onDataUpdate
    },
    {
        type: 'static',
        label: 'Contract Address: ',
        data: {
            formatted: CONTRACT_ADDRESS.slice(0, 6) + '...' + CONTRACT_ADDRESS.slice(-4),
            value: BigInt(0),
            decimals: 0
        },
        animation: false
    },
    {
        type: 'query',
        label: 'Bet Amount: ',
        queryKey: ['betAmount', CONTRACT_ADDRESS],
        queryFn: () => getBetAmount(CONTRACT_ADDRESS, publicClient),
        onDataUpdate
    },
    {
        type: 'query',
        label: 'Payout Multiplier: ',
        queryKey: ['payoutMultiplier', CONTRACT_ADDRESS],
        queryFn: () => getPayoutMultiplier(CONTRACT_ADDRESS, publicClient),
        onDataUpdate
    },
    {
        type: 'query',
        label: 'Best Combo: ',
        queryKey: ['bestCombo', CONTRACT_ADDRESS],
        queryFn: async () => {
            const combo = await getBestCombo(CONTRACT_ADDRESS, publicClient);
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
        queryKey: ['allStatistics', CONTRACT_ADDRESS],
        queryFn: async () => {
            const stats = await getAllStatistics(CONTRACT_ADDRESS, publicClient);
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
        queryFn: () => getBalance(wagmiConfig, {address: playerAddress, chainId: NETWORK_ID as any}),
        onDataUpdate
    },
    {
        type: 'query',
        label: 'Current Streak: ',
        queryKey: ['playerStreak', CONTRACT_ADDRESS, playerAddress],
        queryFn: async () => {
            const streak = await getPlayerStreak(CONTRACT_ADDRESS, playerAddress, publicClient);
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
        queryKey: ['playerTotalWinnings', CONTRACT_ADDRESS, playerAddress],
        queryFn: () => getPlayerTotalWinnings(CONTRACT_ADDRESS, playerAddress, publicClient),
        onDataUpdate
    },
    {
        type: 'query',
        label: 'Game Status: ',
        queryKey: ['gameStatus', CONTRACT_ADDRESS, playerAddress],
        queryFn: async () => {
            const status = await getGameStatus(CONTRACT_ADDRESS, playerAddress, publicClient);
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
        queryKey: ['lastBetResult', CONTRACT_ADDRESS, playerAddress],
        queryFn: async () => {
            const result = await getLastBetResult(CONTRACT_ADDRESS, playerAddress, publicClient);
            return {
                value: BigInt(Number(result.value)),
                formatted: result.formatted,
                decimals: 0
            };
        },
        onDataUpdate
    }
];
