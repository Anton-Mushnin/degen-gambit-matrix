import { getBalance } from '@wagmi/core';
import { privateKeyToAccount } from 'viem/accounts';

import { contractAddress, wagmiConfig } from '../../config';
import { getCostToSpin, getCurrentBlock, getCurrentDailyStreakLength, getCurrentWeeklyStreakLength, getLastSpinBlock, getSupply } from '../../utils/degenGambit';
import { DataItem } from '../types';

export const privateKey = import.meta.env.VITE_PRIVATE_KEY;
export const privateKeyAddress = privateKey ? privateKeyToAccount(privateKey).address : undefined;

export const createContractData = (
    onDataUpdate?: () => void,
    onCurrentBlockUpdate?: (data: any) => void
): DataItem[] => [
    {
        type: 'query',
        label: 'Pot: ',
        queryKey: ['contractBalance', contractAddress],
        queryFn: () => getBalance(wagmiConfig, {address: contractAddress}),
        onDataUpdate
    },
    {
        type: 'query',
        label: 'Gambit Supply: ',
        queryKey: ['gambitSupply', contractAddress],
        queryFn: () => getSupply(contractAddress)
    },
    {
        type: 'query',
        label: 'Current Block: ',
        queryKey: ['currentBlock'],
        queryFn: () => getCurrentBlock(),
        refetchInterval: 5000,
        animation: false,
        onDataUpdate: onCurrentBlockUpdate
    }
];

export const createDegenData = (
    degenAddress: string | undefined,
    displayName: string | undefined,
    getBlocksLeft: () => Promise<{ formatted: string; value: bigint; decimals: number; } | null>,
    blocksLeft: { formatted: string; value: bigint; decimals: number; } | null,
    onCurrentBlockUpdate?: (data: any) => void,
    onLastSpinBlockUpdate?: (data: any) => void
): DataItem[] => {
    if (!degenAddress) return [];

    return [
        {
            type: 'static',
            label: 'Degen: ',
            data: {
                formatted: displayName ?? '',
                value: BigInt(0),
                decimals: 0
            },
            animation: false
        },
        {
            type: 'query',
            label: 'TG7T: ',
            queryKey: ['accountBalance', degenAddress],
            queryFn: () => getBalance(wagmiConfig, {address: degenAddress})
        },
        {
            type: 'query',
            label: 'GAMBIT: ',
            queryKey: ['accountGambitBalance', degenAddress],
            queryFn: () => getBalance(wagmiConfig, {address: degenAddress, token: contractAddress})
        },
        {
            type: 'query',
            label: 'Cost to Spin: ',
            queryKey: ['costToSpin', degenAddress],
            queryFn: () => getCostToSpin(degenAddress),
            animation: false
        },
        {
            type: 'query',
            label: 'Last Spin Block: ',
            queryKey: ['lastSpinBlock', degenAddress],
            queryFn: () => getLastSpinBlock(contractAddress, degenAddress),
            animation: false,
            onDataUpdate: onLastSpinBlockUpdate
        },
        {
            type: 'query',
            label: 'Blocks Left: ',
            queryKey: ['blocksLeft', degenAddress, blocksLeft?.value?.toString() ?? ''],
            queryFn: getBlocksLeft,
            animation: false,
            onDataUpdate: onCurrentBlockUpdate
        },
        {
            type: 'query',
            label: 'Daily Streak: ',
            queryKey: ['dailyStreak', degenAddress],
            queryFn: () => getCurrentDailyStreakLength(degenAddress)
        },
        {
            type: 'query',
            label: 'Weekly Streak: ',
            queryKey: ['weeklyStreak', degenAddress],
            queryFn: () => getCurrentWeeklyStreakLength(degenAddress)
        }
    ];
}; 