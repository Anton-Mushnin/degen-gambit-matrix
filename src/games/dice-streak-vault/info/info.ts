import { getBalance } from '@wagmi/core';
import { PublicClient } from 'viem';

import { wagmiConfig } from '../../../config';
import {
    getBankBalance,
    getBestStreak,
    getDiceStats,
    getPlayerBalance,
    getPlayerTotalWinnings,
    getPlayerStreak,
    getPlayerBankShare,
    getPlayerBankValue,
    getPlayerTotalEarnings,
    getPotentialBonus,
    getBetAmount,
    getBasicPayout,
    getStreakBonuses,
    getInvestmentFee
} from '../contractFunctions/read';
import { DataItem } from '../../types';
import { diceStreakVaultGame } from '..';

export const createContractData = ({
    publicClient,
    contractAddress,
    onDataUpdate,
}: {
    publicClient: PublicClient;
    contractAddress?: string;
    onDataUpdate?: () => void;
}): DataItem[] => {
    const address: string = contractAddress || (diceStreakVaultGame.config.contractAddress as string);
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
            label: 'Best Streak: ',
            queryKey: ['bestStreak', address],
            queryFn: async () => {
                const bestStreak = await getBestStreak(address, publicClient);
                return {
                    value: bestStreak.value,
                    formatted: bestStreak.formatted,
                    decimals: 0
                };
            },
            animation: false,
            onDataUpdate
        },
        {
            type: 'query',
            label: 'Dice Statistics: ',
            animation: false,
            headers: ['Number', 'Occurrences', 'Bets', 'Wins'],
            isTable: true,
            queryKey: ['diceStats', address],
            tableQueryFn: async () => {
                return getDiceStats(address, publicClient);
            },
            onDataUpdate
        }
    ];
};

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

    const address: string = contractAddress || (diceStreakVaultGame.config.contractAddress as string);
    return [
        {
            type: 'static',
            label: 'Game Name: ',
            data: {
                formatted: diceStreakVaultGame.name,
                value: BigInt(0),
                decimals: 0
            },
            animation: false
        },
        {
            type: 'static',
            label: 'Network: ',
            data: {
                formatted: diceStreakVaultGame.network.name,
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
            label: 'Bet Amount: ',
            queryKey: ['betAmount', address],
            queryFn: () => getBetAmount(address, publicClient),
            animation: false
        },
        {
            type: 'query',
            label: 'Basic Payout: ',
            queryKey: ['basicPayout', address],
            queryFn: () => getBasicPayout(address, publicClient),
            animation: false
        },
        {
            type: 'query',
            label: 'Streak Bonuses: ',
            queryKey: ['streakBonuses', address],
            queryFn: async () => {
                const bonuses = await getStreakBonuses(address, publicClient);
                return {
                    value: BigInt(0),
                    formatted: bonuses.formatted,
                    decimals: 0
                };
            },
            animation: false
        },
        {
            type: 'query',
            label: 'Investment Fee: ',
            queryKey: ['investmentFee', address],
            queryFn: () => getInvestmentFee(address, publicClient),
            animation: false
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
    const address: string = contractAddress || (diceStreakVaultGame.config.contractAddress as string);
    const dataItems: DataItem[] = [
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
            label: 'ETH Balance: ',
            queryKey: ['playerEthBalance', playerAddress],
            queryFn: () => getBalance(wagmiConfig, {address: playerAddress, chainId: diceStreakVaultGame.network.id as any}),
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
            label: 'Current Streak: ',
            queryKey: ['playerStreak', address, playerAddress],
            queryFn: async () => {
                const streak = await getPlayerStreak(address, playerAddress, publicClient);
                return {
                    value: BigInt(streak.length),
                    formatted: streak.formatted,
                    decimals: 0
                };
            },
            animation: false,
            onDataUpdate
        },
        {
            type: 'query',
            label: 'Potential Bonus: ',
            queryKey: ['potentialBonus', address, playerAddress],
            queryFn: () => getPotentialBonus(address, playerAddress, publicClient),
            onDataUpdate
        }
    ];

    // Add bank share data if player has investment
    const bankShareItems: DataItem[] = [
        {
            type: 'query',
            label: 'Bank Share (%): ',
            queryKey: ['playerBankShare', address, playerAddress],
            queryFn: async () => {
                const share = await getPlayerBankShare(address, playerAddress, publicClient);
                return {
                    value: share.value,
                    formatted: share.formatted + '%',
                    decimals: 2
                };
            },
            animation: false,
            onDataUpdate
        },
        {
            type: 'query',
            label: 'Bank Value: ',
            queryKey: ['playerBankValue', address, playerAddress],
            queryFn: () => getPlayerBankValue(address, playerAddress, publicClient),
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

    // Check if player has bank share and add items conditionally
    // For now, include them - contract will handle zero values
    dataItems.push(...bankShareItems);

    return dataItems;
};



