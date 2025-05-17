import { contractAddress, wagmiConfig } from '../config';
import styles from './ContractInfo.module.css';
import { getBalance } from '@wagmi/core';
import { getSupply, getCurrentBlock, getCostToSpin, getCurrentDailyStreakLength, getCurrentWeeklyStreakLength, getLastSpinBlock } from '../utils/degenGambit';
import { useActiveAccount } from 'thirdweb/react';
import Row from './Row';
import { useDegenGambitInfo } from '../hooks/useDegenGambitInfo';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, useRef } from 'react';
import { privateKeyToAccount } from 'viem/accounts';
import { useAccountToUse } from '../hooks/useAccountToUse';
import useBlocksLeft from '../hooks/useBlocksLeft';

export const privateKey = import.meta.env.VITE_PRIVATE_KEY
const privateKeyAddress = privateKey ? privateKeyToAccount(privateKey).address : undefined

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

    return (
        <div className={styles.container}>
            <Row 
                queryKey={['contractBalance', contractAddress]} 
                label="Pot: " 
                queryFn={() => getBalance(wagmiConfig, {address: contractAddress})} 
                onDataUpdate={() => {
                    queryClient.invalidateQueries({queryKey: ['degenGambitInfo', contractAddress]});
                }}
            />
            <Row 
                queryKey={['gambitSupply', contractAddress]} 
                label="Gambit Supply: " 
                queryFn={() => getSupply(contractAddress)} 
            />
            <Row 
                queryKey={['currentBlock']} 
                label="Current Block: " 
                queryFn={() => getCurrentBlock()} 
                refetchInterval={5000} 
                animation={false} 
                onDataUpdate={handleCurrentBlockUpdate}
            />

            <div style={{height: '20px'}} />
            {degenAddress && <div className={styles.item}>
                <span>{`Degen: ${displayName}`}</span>
            </div>}
            <Row 
                queryKey={['accountBalance', degenAddress ?? '']} 
                label="TG7T: " 
                queryFn={() => getBalance(wagmiConfig, {address: degenAddress ?? ''})} 
            />
            <Row 
                queryKey={['accountGambitBalance', degenAddress ?? '']} 
                label="GAMBIT: " 
                queryFn={() => getBalance(wagmiConfig, {address: degenAddress ?? '', token: contractAddress})} 
            />
            <Row 
                queryKey={['costToSpin', degenAddress ?? '']} 
                label="Cost to Spin: " 
                queryFn={() => getCostToSpin(degenAddress ?? '')}  
                animation={false}
            />
            <Row 
                queryKey={['lastSpinBlock', degenAddress ?? '']} 
                label="Last Spin Block: " 
                queryFn={() => getLastSpinBlock(contractAddress, degenAddress ?? '')} 
                animation={false} 
                onDataUpdate={handleLastSpinBlockUpdate}
            />
            <Row 
                queryKey={['blocksLeft', degenAddress ?? '', blocksLeft?.value?.toString()]} 
                label="Blocks Left: " 
                queryFn={getBlocksLeft} 
                animation={false}
            />
            
            <Row 
                queryKey={['dailyStreak', degenAddress ?? '']} 
                label="Daily Streak: " 
                queryFn={() => getCurrentDailyStreakLength(degenAddress ?? '')} 
            />
            <Row 
                queryKey={['weeklyStreak', degenAddress ?? '']} 
                label="Weekly Streak: " 
                queryFn={() => getCurrentWeeklyStreakLength(degenAddress ?? '')} 
            />
        </div>
    );
};

export default ContractInfo;