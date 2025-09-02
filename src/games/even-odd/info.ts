import { getPublicClient } from '@wagmi/core';
import { privateKeyToAccount } from 'viem/accounts';
import { formatUnits } from 'viem';

import { wagmiConfig } from '../../config';
import { 
  getBetAmount, 
  getPayoutAmount, 
  getHasCommit, 
  getFreeSpinAvailable, 
  getTotalWinnings,
  getLastResult 
} from '../../utils/contract';
import { 
  getPotBalance, 
  getCurrentBlock, 
  getPlayerBalance 
} from '../../utils/blockchain';
import { DataItem } from '../types';

// Contract address from deployments
const CONTRACT_ADDRESS = '0xEf506F17e839fc646Ff61605E640e4C78D38ffCF';

export const privateKey = import.meta.env.VITE_PRIVATE_KEY;
export const privateKeyAddress = privateKey ? privateKeyToAccount(privateKey).address : undefined;

export const createContractData = (
    onCurrentBlockUpdate?: (data: any) => void
): DataItem[] => [
    {
        type: 'query',
        label: 'Pot Balance: ',
        queryKey: ['potBalance', CONTRACT_ADDRESS],
        queryFn: async () => {
            const balance = await getPotBalance(getPublicClient(wagmiConfig), CONTRACT_ADDRESS);
            return {
                value: balance,
                formatted: formatUnits(balance, 18),
                decimals: 18
            };
        },
    },
    {
        type: 'query',
        label: 'Current Block: ',
        queryKey: ['currentBlock'],
        queryFn: async () => {
            const block = await getCurrentBlock(getPublicClient(wagmiConfig));
            return {
                value: BigInt(block),
                formatted: block.toString(),
                decimals: 0
            };
        },
        refetchInterval: 5000,
        animation: false,
        onDataUpdate: onCurrentBlockUpdate
    },
    {
        type: 'query',
        label: 'Bet Amount: ',
        queryKey: ['betAmount', CONTRACT_ADDRESS],
        queryFn: async () => {
            const amount = await getBetAmount(getPublicClient(wagmiConfig), CONTRACT_ADDRESS);
            return {
                value: amount,
                formatted: formatUnits(amount, 18),
                decimals: 18
            };
        },
        animation: false
    },
    {
        type: 'query',
        label: 'Payout Amount: ',
        queryKey: ['payoutAmount', CONTRACT_ADDRESS],
        queryFn: async () => {
            const amount = await getPayoutAmount(getPublicClient(wagmiConfig), CONTRACT_ADDRESS);
            return {
                value: amount,
                formatted: formatUnits(amount, 18),
                decimals: 18
            };
        },
        animation: false
    }
];

export const createPlayerData = (
    playerAddress: string | undefined,
    displayName: string | undefined,
): DataItem[] => {
    if (!playerAddress) return [];

    return [
        {
            type: 'static',
            label: 'Player: ',
            data: {
                formatted: displayName ?? playerAddress.slice(0, 6) + '...' + playerAddress.slice(-4),
                value: BigInt(0),
                decimals: 0
            },
            animation: false
        },
        {
            type: 'query',
            label: 'Player Balance: ',
            queryKey: ['playerBalance', playerAddress],
            queryFn: async () => {
                const balance = await getPlayerBalance(getPublicClient(wagmiConfig), playerAddress);
                return {
                    value: balance,
                    formatted: formatUnits(balance, 18),
                    decimals: 18
                };
            },
            animation: true
        },
        {
            type: 'query',
            label: 'Has Commit: ',
            queryKey: ['hasCommit', CONTRACT_ADDRESS, playerAddress],
            queryFn: async () => {
                const hasCommit = await getHasCommit(getPublicClient(wagmiConfig), CONTRACT_ADDRESS, playerAddress);
                return {
                    value: hasCommit ? BigInt(1) : BigInt(0),
                    formatted: hasCommit ? 'Yes' : 'No',
                    decimals: 0
                };
            },
            animation: false
        },
        {
            type: 'query',
            label: 'Free Spin Available: ',
            queryKey: ['freeSpinAvailable', CONTRACT_ADDRESS, playerAddress],
            queryFn: async () => {
                const hasFreeSpin = await getFreeSpinAvailable(getPublicClient(wagmiConfig), CONTRACT_ADDRESS, playerAddress);
                return {
                    value: hasFreeSpin ? BigInt(1) : BigInt(0),
                    formatted: hasFreeSpin ? 'Yes' : 'No',
                    decimals: 0
                };
            },
            animation: false
        },
        {
            type: 'query',
            label: 'Total Winnings: ',
            queryKey: ['totalWinnings', CONTRACT_ADDRESS, playerAddress],
            queryFn: async () => {
                const winnings = await getTotalWinnings(getPublicClient(wagmiConfig), CONTRACT_ADDRESS, playerAddress);
                return {
                    value: winnings,
                    formatted: formatUnits(winnings, 18),
                    decimals: 18
                };
            },
            animation: true
        },
        {
            type: 'query',
            label: 'Last Result: ',
            queryKey: ['lastResult', CONTRACT_ADDRESS, playerAddress],
            queryFn: async () => {
                const result = await getLastResult(getPublicClient(wagmiConfig), CONTRACT_ADDRESS, playerAddress);
                return {
                    value: BigInt(0),
                    formatted: result || 'None',
                    decimals: 0
                };
            },
            animation: false
        }
    ];
}; 