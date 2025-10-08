import { getBalance } from '@wagmi/core';
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
    getAmountInvested,
    getSharePercentage,
    getShareChange,
    getPlayerTotalWinnings,
    getPlayerCurrentStreak,
    getNextNeededDiceNumber,
    getPotentialBonusAmount
} from '../contractFunctions/read';
import { DataItem } from '../../types';
import { diceRunGame } from '..';

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
            label: 'Bet Amount: ',
            queryKey: ['betAmount', address],
            queryFn: () => getBetAmount(address, publicClient),
            onDataUpdate
        },
        {
            type: 'query',
            label: 'Return on Winning Bet: ',
            queryKey: ['payoutCalculation', address],
            queryFn: () => getPayoutCalculation(address, publicClient),
            onDataUpdate
        },
        {
            type: 'query',
            label: 'Streak Bank Share Percentages: ',
            animation: false,
            headers: ['Streak Length', 'Share Percentage'],
            isTable: true,
            queryKey: ['streakBankSharePercentages', address],
            tableQueryFn: () => getStreakBankSharePercentages(address, publicClient),
            onDataUpdate
        },
        {
            type: 'query',
            label: 'Investment Fee Percent: ',
            queryKey: ['investmentFeePercent', address],
            queryFn: () => getInvestmentFeePercent(address, publicClient),
            animation: false,
            onDataUpdate
        },
        {
            type: 'query',
            label: 'Current Bank Balance: ',
            queryKey: ['bankBalance', address],
            queryFn: () => getBankBalance(address, publicClient),
            onDataUpdate
        },
        {
            type: 'query',
            label: 'Best Streak Achieved: ',
            queryKey: ['bestStreak', address],
            queryFn: () => getBestStreak(address, publicClient),
            animation: false,
            onDataUpdate
        },
        {
            type: 'query',
            label: 'Dice Statistics: ',
            animation: false,
            headers: ['Dice Number', 'Occurrences', 'Bets', 'Wins'],
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
            label: 'Player Balance: ',
            queryKey: ['playerBalance', playerAddress],
            queryFn: () => getBalance(wagmiConfig, {address: playerAddress, chainId: diceRunGame.network.id as any}),
            onDataUpdate
        },
        {
            type: 'query',
            label: 'Player Total Winnings: ',
            queryKey: ['playerTotalWinnings', address, playerAddress],
            queryFn: () => getPlayerTotalWinnings(address, playerAddress, publicClient),
            onDataUpdate
        },
        {
            type: 'query',
            label: 'Player\'s Current Streak: ',
            queryKey: ['playerCurrentStreak', address, playerAddress],
            queryFn: () => getPlayerCurrentStreak(address, playerAddress, publicClient),
            animation: false,
            onDataUpdate
        },
        {
            type: 'query',
            label: 'Amount Invested: ',
            queryKey: ['amountInvested', address, playerAddress],
            queryFn: () => getAmountInvested(address, playerAddress, publicClient),
            onDataUpdate
        },
        {
            type: 'query',
            label: 'Share Percentage: ',
            queryKey: ['sharePercentage', address, playerAddress],
            queryFn: () => getSharePercentage(address, playerAddress, publicClient),
            animation: false,
            onDataUpdate
        },
        {
            type: 'query',
            label: 'Share Change: ',
            queryKey: ['shareChange', address, playerAddress],
            queryFn: () => getShareChange(address, playerAddress, publicClient),
            onDataUpdate
        },
        {
            type: 'query',
            label: 'Next Needed Dice Number: ',
            queryKey: ['nextNeededDiceNumber', address, playerAddress],
            queryFn: () => getNextNeededDiceNumber(address, playerAddress, publicClient),
            animation: false,
            onDataUpdate
        },
        {
            type: 'query',
            label: 'Potential Bonus Amount: ',
            queryKey: ['potentialBonusAmount', address, playerAddress],
            queryFn: () => getPotentialBonusAmount(address, playerAddress, publicClient),
            onDataUpdate
        }
    ];
};
