import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getBalance } from '@wagmi/core';
import { useActiveAccount } from 'thirdweb/react';
import { privateKeyToAccount } from 'viem/accounts';

import { contractAddress, wagmiConfig } from '../../config';
import { useAccountToUse } from '../../hooks/degen-gambit/useAccountToUse';
import useBlocksLeft from '../../hooks/useBlocksLeft';
import { useDegenGambitInfo } from '../../hooks/degen-gambit/useDegenGambitInfo';
import { getCostToSpin, getCurrentBlock, getCurrentDailyStreakLength, getCurrentWeeklyStreakLength, getLastSpinBlock, getSupply } from '../../utils/degenGambit';
import QueryValueRow from '../matrixUI/QueryValueRow';
import ValueRow from '../matrixUI/ValueRow';
import styles from './ContractInfo.module.css';

export const privateKey = import.meta.env.VITE_PRIVATE_KEY
const privateKeyAddress = privateKey ? privateKeyToAccount(privateKey).address : undefined

interface QueryDataItem {
    type: 'query';
    label: string;
    queryKey: string[];
    queryFn: () => Promise<{ formatted: string; value: bigint; decimals: number; } | null>;
    refetchInterval?: number;
    animation?: boolean;
    onDataUpdate?: (data: any) => void;
}

interface StaticDataItem {
    type: 'static';
    label: string;
    data: {
        formatted: string;
        value: bigint;
        decimals: number;
    };
    animation?: boolean;
}

type DataItem = QueryDataItem | StaticDataItem;

const ContractInfo = () => {
    const contractInfo = useDegenGambitInfo(contractAddress);
    const activeAccount = useActiveAccount();
    const { displayName } = useAccountToUse();
    const [degenAddress, setDegenAddress] = useState<string | undefined>(privateKeyAddress);
    const queryClient = useQueryClient();
    
    // Track previous blocks left value to detect changes
    const prevBlocksLeftRef = useRef<string | undefined>(undefined);

    // Set degen address from active account
    useEffect(() => {
        if (activeAccount?.address && !privateKeyAddress) {
            setDegenAddress(activeAccount.address);
        }
    }, [activeAccount]);

    // Use the custom hook for blocks left calculation
    const { 
        getBlocksLeft, 
        handleCurrentBlockUpdate, 
        handleLastSpinBlockUpdate,
        blocksLeft 
    } = useBlocksLeft(degenAddress, contractInfo.data?.blocksToAct);

    // Effect to handle query invalidation when blocks left becomes zero
    useEffect(() => {
        if (!blocksLeft) return;
        
        const currentValue = blocksLeft.value.toString();
        
        // If blocks left becomes zero, invalidate cost to spin
        if (currentValue === '0' && prevBlocksLeftRef.current !== '0') {
            queryClient.invalidateQueries({queryKey: ['costToSpin']});
        }
        
        // Update ref for next comparison
        prevBlocksLeftRef.current = currentValue;
    }, [blocksLeft, queryClient]);

    const contractData: DataItem[] = [
        {
            type: 'query',
            label: 'Pot: ',
            queryKey: ['contractBalance', contractAddress],
            queryFn: () => getBalance(wagmiConfig, {address: contractAddress}),
            onDataUpdate: () => {
                queryClient.invalidateQueries({queryKey: ['degenGambitInfo', contractAddress]});
            }
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
            onDataUpdate: handleCurrentBlockUpdate
        }
    ];

    const degenData: DataItem[] = degenAddress ? [
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
            onDataUpdate: handleLastSpinBlockUpdate
        },
        {
            type: 'query',
            label: 'Blocks Left: ',
            queryKey: ['blocksLeft', degenAddress, blocksLeft?.value?.toString() ?? ''],
            queryFn: getBlocksLeft,
            animation: false
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
    ] : [];

    return (
        <div className={styles.container}>
            {contractData.map((item, index) => (
                item.type === 'query' ? (
                    <QueryValueRow
                        key={index}
                        label={item.label}
                        queryKey={item.queryKey}
                        queryFn={item.queryFn}
                        refetchInterval={item.refetchInterval}
                        animation={item.animation}
                        onDataUpdate={item.onDataUpdate}
                    />
                ) : (
                    <ValueRow
                        key={index}
                        label={item.label}
                        data={item.data}
                        animation={item.animation}
                    />
                )
            ))}
            <div style={{height: '20px'}} />
            {degenData.map((item, index) => (
                item.type === 'query' ? (
                    <QueryValueRow
                        key={index}
                        label={item.label}
                        queryKey={item.queryKey}
                        queryFn={item.queryFn}
                        refetchInterval={item.refetchInterval}
                        animation={item.animation}
                        onDataUpdate={item.onDataUpdate}
                    />
                ) : (
                    <ValueRow
                        key={index}
                        label={item.label}
                        data={item.data}
                        animation={item.animation}
                    />
                )
            ))}
        </div>
    );
};

export default ContractInfo;