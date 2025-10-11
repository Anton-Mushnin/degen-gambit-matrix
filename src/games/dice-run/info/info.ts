import { getBalance } from '@wagmi/core';
import { privateKeyToAccount } from 'viem/accounts';
import { PublicClient } from 'viem';

import { wagmiConfig } from '../../../config';
import {
    getBetAmount,
    getPayoutCalculation,
    getStreakBankSharePercentages,
    getInvestmentFeePercent,
    getBankBalance,
    getBestStreak,
    getDiceStatistics,
    getSharePercentage,
    getCurrentShareValue,
    // getTotalWithdrawals,
    getTotalEarnings,
    getPlayerTotalWinnings,
    getPlayerCurrentStreak,
    // getNextNeededDiceNumber,
    getPotentialBonusAmount
} from '../contractFunctions/read';
import { DataItem } from '../../types';
import { diceRunGame } from '..';

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
    const address: string = contractAddress || (diceRunGame.config.contractAddress as string);
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
            queryFn: () => getBestStreak(address, publicClient),
            animation: false,
            onDataUpdate
        },
        {
            type: 'query',
            label: 'Stats: ',
            animation: false,
            headers: ['Face', 'Occurrences', 'Bets', 'Wins'],
            isTable: true,
            queryKey: ['diceStatistics', address],
            tableQueryFn: () => getDiceStatistics(address, publicClient),
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
    const address: string = contractAddress || (diceRunGame.config.contractAddress as string);
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
            queryFn: () => getBalance(wagmiConfig, {address: playerAddress, chainId: diceRunGame.network.id as any}),
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
            queryKey: ['playerCurrentStreak', address, playerAddress],
            queryFn: () => getPlayerCurrentStreak(address, playerAddress, publicClient),
            animation: false,
            onDataUpdate
        },
                {
            type: 'query',
            label: 'Potential Bonus Amount: ',
            queryKey: ['potentialBonusAmount', address, playerAddress],
            queryFn: () => getPotentialBonusAmount(address, playerAddress, publicClient),
            onDataUpdate,
            animation: false
        },
        { type: 'static', label: '', data: null, animation: false },
        {
            type: 'query',
            label: 'Player\'s Share: ',
            queryKey: ['sharePercentage', address, playerAddress],
            queryFn: () => getSharePercentage(address, playerAddress, publicClient),
            animation: false,
            onDataUpdate
        },
        {
            type: 'query',
            label: 'Current value of player\'s share: ',
            queryKey: ['currentShareValue', address, playerAddress],
            queryFn: () => getCurrentShareValue(address, playerAddress, publicClient),
            onDataUpdate
        },
        {
            type: 'query',
            label: 'Total earnings: ',
            queryKey: ['totalEarnings', address, playerAddress],
            queryFn: () => getTotalEarnings(address, playerAddress, publicClient),
            onDataUpdate
        },

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

    const address: string = contractAddress || (diceRunGame.config.contractAddress as string);
    return [
        {
            type: 'static',
            label: '',
            data: {
                formatted: diceRunGame.name,
                value: BigInt(0),
                decimals: 0
            },
            animation: false
        },
        {
            type: 'static',
            label: '',
            data: {
                formatted: diceRunGame.network.name,
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
            label: 'Fixed Bet Amount: ',
            queryKey: ['betAmount', address],
            queryFn: () => getBetAmount(address, publicClient),
            animation: false
        },
        {
            type: 'query',
            label: 'Basic Payout Multiplier: ',
            queryKey: ['payoutCalculation', address],
            queryFn: () => getPayoutCalculation(address, publicClient),
            animation: false
        },
        {
            type: 'query',
            label: 'Streak Bank Shares: ',
            animation: false,
            headers: ['Streak Length', 'Share Percentage'],
            isTable: true,
            queryKey: ['streakBankSharePercentages', address],
            tableQueryFn: () => getStreakBankSharePercentages(address, publicClient)
        },
        {
            type: 'query',
            label: 'Investment Fee Percent: ',
            queryKey: ['investmentFeePercent', address],
            queryFn: () => getInvestmentFeePercent(address, publicClient),
            animation: false
        }
    ];
};
