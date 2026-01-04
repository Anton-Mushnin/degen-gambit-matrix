import { getBalance } from '@wagmi/core';
import { PublicClient } from 'viem';

import { wagmiConfig } from '../../../config';
// TODO: Implement contractFunctions/read.ts
// import {
//     getBankBalance,
//     getBestStreak,
//     getDiceStats,
//     getPlayerTotalWinnings,
//     getPlayerStreak,
//     getPlayerBankShare,
//     getPlayerBankValue,
//     getPlayerTotalEarnings,
//     getPotentialBonus,
//     getBetAmount,
//     getBasicPayout,
//     getStreakBonuses,
//     getInvestmentFee
// } from '../contractFunctions/read';

// Placeholder functions until implemented
const getBankBalance = async (_a: string, _p: any) => ({ value: BigInt(0), formatted: '0', decimals: 0 });
const getBestStreak = async (_a: string, _p: any) => ({ value: BigInt(0), formatted: '0', decimals: 0 });
const getDiceStats = async (_a: string, _p: any) => [['1', '0', '0', '0']];
const getPlayerTotalWinnings = async (_a: string, _pa: string, _p: any) => ({ value: BigInt(0), formatted: '0', decimals: 0 });
const getPlayerStreak = async (_a: string, _pa: string, _p: any) => ({ length: 0, formatted: '0' });
const getPlayerBankShare = async (_a: string, _pa: string, _p: any) => ({ value: BigInt(0), formatted: '0' });
const getPlayerBankValue = async (_a: string, _pa: string, _p: any) => ({ value: BigInt(0), formatted: '0', decimals: 0 });
const getPlayerTotalEarnings = async (_a: string, _pa: string, _p: any) => ({ value: BigInt(0), formatted: '0', decimals: 0 });
const getPotentialBonus = async (_a: string, _pa: string, _p: any) => ({ value: BigInt(0), formatted: '0', decimals: 0 });
const getBetAmount = async (_a: string, _p: any) => ({ value: BigInt(0), formatted: '0', decimals: 0 });
const getBasicPayout = async (_a: string, _p: any) => ({ value: BigInt(0), formatted: '0', decimals: 0 });
const getStreakBonuses = async (_a: string, _p: any) => ({ formatted: '0' });
const getInvestmentFee = async (_a: string, _p: any) => ({ value: BigInt(0), formatted: '0', decimals: 0 });
import { DataItem } from '../../types';
// TODO: Create index.tsx for diceStreakVaultGame
// import { diceStreakVaultGame } from '..';

// Placeholder until implemented
const diceStreakVaultGame = {
    name: 'Dice Streak Vault',
    network: { id: 1, name: 'Testnet' },
    config: { contractAddress: '0x0' }
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



