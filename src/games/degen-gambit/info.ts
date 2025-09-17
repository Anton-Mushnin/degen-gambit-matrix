import { getBalance } from '@wagmi/core';
import { privateKeyToAccount } from 'viem/accounts';
import { PublicClient } from 'viem';

import { wagmiConfig } from '../../config';
import { getBalanceOf, getBlocksToAct, getCostToSpin, getCurrentBlock, getCurrentDailyStreakLength, getCurrentWeeklyStreakLength, getLastSpinBlock, getSupply } from './degenGambit';
import { DataItem } from '../types';
import { degenGambitGame } from './index';

export const privateKey = import.meta.env.VITE_PRIVATE_KEY;
export const privateKeyAddress = privateKey ? privateKeyToAccount(privateKey).address : undefined;

export const createContractData = ({
    publicClient,
    onDataUpdate,
    onCurrentBlockUpdate
}: {
    publicClient: PublicClient;
    onDataUpdate?: () => void;
    onCurrentBlockUpdate?: (data: any) => void;
}): DataItem[] => [
    {
        type: 'query',
        label: 'Pot: ',
        queryKey: ['contractBalance', degenGambitGame.config.contractAddress as string],
        queryFn: () => getBalance(wagmiConfig, {address: degenGambitGame.config.contractAddress as string, chainId: degenGambitGame.network.id as any}),
        onDataUpdate
    },
    {
        type: 'static',
        label: 'Contract Address: ',
        data: {
            formatted: (degenGambitGame.config.contractAddress as string).slice(0, 6) + '...' + (degenGambitGame.config.contractAddress as string).slice(-4),
            value: BigInt(0),
            decimals: 0
        },
        animation: false
    },
    {
        type: 'query',
        label: 'Gambit Supply: ',
        queryKey: ['gambitSupply', degenGambitGame.config.contractAddress as string],
        queryFn: () => getSupply(degenGambitGame.config.contractAddress as string, publicClient)
    },
    {
        type: 'query',
        label: 'Current Block: ',
        queryKey: ['currentBlock'],
        queryFn: () => getCurrentBlock(publicClient),
        refetchInterval: 5000,
        animation: false,
        onDataUpdate: (data) => {
            onCurrentBlockUpdate?.(data);
        }
    },
    {
        type: 'query',
        label: 'Blocks To Act: ',
        queryKey: ['blocksToAct'],
        queryFn: () => getBlocksToAct(degenGambitGame.config.contractAddress as string, publicClient),
        animation: false
    }
];

export const createDegenData = ({
    publicClient,
    degenAddress,
    displayName,
    queryClient,
    onLastSpinBlockUpdate,
}: {
    publicClient: PublicClient;
    degenAddress: string | undefined;
    displayName: string | undefined;
    queryClient: any;
    onLastSpinBlockUpdate?: () => void;
}): DataItem[] => {
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
            queryFn: () => getBalance(wagmiConfig, {address: degenAddress, chainId: degenGambitGame.network.id as any})
        },
        {
            type: 'query',
            label: 'GAMBIT: ',
            queryKey: ['accountGambitBalance', degenAddress],
            queryFn: () => getBalanceOf(degenGambitGame.config.contractAddress as string, degenAddress, publicClient)
        },
        {
            type: 'query',
            label: 'Cost to Spin: ',
            queryKey: ['costToSpin', degenAddress],
            queryFn: () => getCostToSpin(degenGambitGame.config.contractAddress as string, degenAddress, publicClient),
            animation: false
        },
        {
            type: 'query',
            label: 'Last Spin Block: ',
            queryKey: ['lastSpinBlock', degenAddress],
            queryFn: () => getLastSpinBlock(degenGambitGame.config.contractAddress as string, degenAddress, publicClient),
            animation: false,
            onDataUpdate: () => {
                onLastSpinBlockUpdate?.();
            }
        },
        {
            type: 'query',
            label: 'Blocks Left: ',
            queryKey: ['blocksLeft', degenAddress],
            queryFn: async () => {
                const currentBlock = queryClient.getQueryData(['currentBlock']) as {value: bigint} | undefined;
                const lastSpinBlock = queryClient.getQueryData(['lastSpinBlock', degenAddress]) as {value: bigint} | undefined;
                const blocksToAct = queryClient.getQueryData(['blocksToAct']) as {value: bigint} | undefined;
                
                if (!currentBlock || !lastSpinBlock || !blocksToAct) {
                    return {
                        formatted: 'N/A',
                        value: BigInt(0),
                        decimals: 0
                    };
                }
                
                const deadline = lastSpinBlock.value + blocksToAct.value;
                const blocksLeftValue = Math.max(0, Number(deadline - currentBlock.value));
                
                return {
                    formatted: blocksLeftValue.toString(),
                    value: BigInt(blocksLeftValue),
                    decimals: 0
                };
            },
            animation: false,
        },
        {
            type: 'query',
            label: 'Daily Streak: ',
            queryKey: ['dailyStreak', degenAddress],
            queryFn: () => getCurrentDailyStreakLength(degenGambitGame.config.contractAddress as string, degenAddress, publicClient)
        },
        {
            type: 'query',
            label: 'Weekly Streak: ',
            queryKey: ['weeklyStreak', degenAddress],
            queryFn: () => getCurrentWeeklyStreakLength(degenGambitGame.config.contractAddress as string, degenAddress, publicClient)
        }
    ];
}; 