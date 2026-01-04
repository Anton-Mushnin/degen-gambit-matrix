import { getBalance } from '@wagmi/core';
import { PublicClient } from 'viem';

import { wagmiConfig } from '../../../config';
import {
    getContractAddress,
    getCostOfPlay,
    getPayoutMultiplier,
    getDepositFee,
    getBankBalance,
    getStreakBonus,
    getNumberStatistics,
    getBestStreak,
    getPlayerStatus,
    getPlayerStreak,
    getPlayerTotalWinnings,
    getPlayerShare,
    getPlayerShareValue,
    getPlayerTotalEarnings
} from '../contractFunctions/read';
import { DataItem } from '../../types';
import { guessNextNumberGame } from '..';

export const createContractConstantsData = ({
    publicClient,
    contractAddress,
}: {
    publicClient?: PublicClient;
    contractAddress?: string;
}): DataItem[] => {
    if (!publicClient || !contractAddress) {
        return [];
    }

    const address: string = contractAddress || (guessNextNumberGame.config.contractAddress as string);
    return [
        {
            type: 'static',
            label: '',
            data: {
                formatted: guessNextNumberGame.name,
                value: BigInt(0),
                decimals: 0
            },
            animation: false
        },
        {
            type: 'static',
            label: '',
            data: {
                formatted: guessNextNumberGame.network.name,
                value: BigInt(0),
                decimals: 0
            },
            animation: false
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
            label: 'Cost of Play: ',
            queryKey: ['costOfPlay', address],
            queryFn: () => getCostOfPlay(address, publicClient),
            animation: false
        },
        {
            type: 'query',
            label: 'Payout Multiplier: ',
            queryKey: ['payoutMultiplier', address],
            queryFn: () => getPayoutMultiplier(address, publicClient),
            animation: false
        },
        {
            type: 'query',
            label: 'Deposit Fee: ',
            queryKey: ['depositFee', address],
            queryFn: () => getDepositFee(address, publicClient),
            animation: false
        }
    ];
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
    const address: string = contractAddress || (guessNextNumberGame.config.contractAddress as string);
    return [
        {
            type: 'query',
            label: 'Bank Balance: ',
            queryKey: ['bankBalance', address],
            queryFn: () => getBankBalance(address, publicClient),
            onDataUpdate
        },
        {
            type: 'query',
            label: 'Streak 3 Bonus: ',
            queryKey: ['streakBonus3', address],
            queryFn: () => getStreakBonus(address, publicClient, 3),
            onDataUpdate
        },
        {
            type: 'query',
            label: 'Streak 4 Bonus: ',
            queryKey: ['streakBonus4', address],
            queryFn: () => getStreakBonus(address, publicClient, 4),
            onDataUpdate
        },
        {
            type: 'query',
            label: 'Streak 5 Bonus: ',
            queryKey: ['streakBonus5', address],
            queryFn: () => getStreakBonus(address, publicClient, 5),
            onDataUpdate
        },
        {
            type: 'query',
            label: 'Streak 6 Bonus: ',
            queryKey: ['streakBonus6', address],
            queryFn: () => getStreakBonus(address, publicClient, 6),
            onDataUpdate
        },
        {
            type: 'query',
            label: 'Statistics: ',
            animation: false,
            headers: ['Number', 'Occurrences'],
            isTable: true,
            queryKey: ['numberStatistics', address],
            tableQueryFn: async () => {
                return getNumberStatistics(address, publicClient);
            },
            onDataUpdate
        },
        {
            type: 'query',
            label: 'Best Streak: ',
            queryKey: ['bestStreak', address],
            queryFn: () => getBestStreak(address, publicClient),
            animation: false,
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
    const address: string = contractAddress || (guessNextNumberGame.config.contractAddress as string);
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
            label: 'Balance: ',
            queryKey: ['playerBalance', playerAddress],
            queryFn: () => getBalance(wagmiConfig, { address: playerAddress as `0x${string}`, chainId: guessNextNumberGame.network.id as any }),
            onDataUpdate
        },
        {
            type: 'query',
            label: 'Status: ',
            queryKey: ['playerStatus', address, playerAddress],
            queryFn: () => getPlayerStatus(address, playerAddress, publicClient),
            animation: false,
            onDataUpdate
        },
        {
            type: 'query',
            label: 'Current Streak: ',
            queryKey: ['playerStreak', address, playerAddress],
            queryFn: () => getPlayerStreak(address, playerAddress, publicClient),
            animation: false,
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
            label: 'Bank Share: ',
            queryKey: ['playerShare', address, playerAddress],
            queryFn: () => getPlayerShare(address, playerAddress, publicClient),
            animation: false,
            onDataUpdate
        },
        {
            type: 'query',
            label: 'Share Value: ',
            queryKey: ['playerShareValue', address, playerAddress],
            queryFn: () => getPlayerShareValue(address, playerAddress, publicClient),
            onDataUpdate
        },
        {
            type: 'query',
            label: 'Total Earnings: ',
            queryKey: ['playerTotalEarnings', address, playerAddress],
            queryFn: () => getPlayerTotalEarnings(address, playerAddress, publicClient),
            onDataUpdate
        }
    ];
};

