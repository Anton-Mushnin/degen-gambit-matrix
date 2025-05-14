import { contractAddress, wagmiConfig } from '../config';
import styles from './ContractInfo.module.css';
import { getBalance } from '@wagmi/core';
import { getSupply, getCurrentBlock, getCostToSpin, getCurrentDailyStreakLength, getCurrentWeeklyStreakLength, getLastSpinBlock } from '../utils/degenGambit';
import { useActiveAccount } from 'thirdweb/react';
import Row from './Row';
import { useDegenGambitInfo } from '../hooks/useDegenGambitInfo';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, useRef, useCallback } from 'react';
import { privateKeyToAccount } from 'viem/accounts';
import { useAccountToUse } from '../hooks/useAccountToUse';


export const privateKey = import.meta.env.VITE_PRIVATE_KEY
const privateKeyAddress = privateKey ? privateKeyToAccount(privateKey).address : undefined

const ContractInfo = () => {
    const contractInfo = useDegenGambitInfo(contractAddress);
    const activeAccount = useActiveAccount()
    const { displayName } = useAccountToUse();
    const [degenAddress, setDegenAddress] = useState<string | undefined>(privateKeyAddress);
    const [blocksLeft, setBlocksLeft] = useState<{
        value: bigint,
        formatted: string,
        decimals: number
    } | null>(null);

    // Refs to store the latest data
    const currentBlockRef = useRef<{value: bigint, formatted: string, decimals: number} | null>(null);
    const lastSpinBlockRef = useRef<{value: bigint, formatted: string, decimals: number} | null>(null);

    const queryClient = useQueryClient();

    useEffect(() => {
        if (activeAccount?.address && !privateKeyAddress) {
            setDegenAddress(activeAccount.address);
            // Reset blocksLeft and lastSpinBlockRef when address changes
            setBlocksLeft(null);
            lastSpinBlockRef.current = null;
        }
    }, [activeAccount]);

    // Calculate blocks left based on current data
    const calculateBlocksLeft = () => {
        if (!contractInfo.data?.blocksToAct || !currentBlockRef.current || !lastSpinBlockRef.current) return null;
        
        const deadline = lastSpinBlockRef.current.value + BigInt(contractInfo.data?.blocksToAct);
        const blocksLeftValue = Math.max(Math.min(Number(deadline - currentBlockRef.current.value), contractInfo.data?.blocksToAct), 0);
        
        if (blocksLeftValue === 0) {
            queryClient.invalidateQueries({queryKey: ['costToSpin']});
        }   
        
        return {
            value: BigInt(blocksLeftValue),
            formatted: blocksLeftValue.toString(),
            decimals: 0,
        };
    };

    // Update blocks left whenever contractInfo.data changes
    useEffect(() => {
        if (currentBlockRef.current && lastSpinBlockRef.current) {
            const blocks = calculateBlocksLeft();
            if (blocks) setBlocksLeft(blocks);
        }
    }, [contractInfo.data]);

    // Function to return the current blocks left for the Row component
    const getBlocksLeft = useCallback(async () => {
        return blocksLeft || {
            value: BigInt(0),
            formatted: '0',
            decimals: 0
        };
    }, [blocksLeft]);

    return (
        <div className={styles.container}>
            <Row queryKey={['contractBalance', contractAddress]} label="Pot: " queryFn={() => getBalance(wagmiConfig, {address: contractAddress})} onDataUpdate={() => {
                queryClient.invalidateQueries({queryKey: ['degenGambitInfo', contractAddress]});
            }}/>
            <Row queryKey={['gambitSupply', contractAddress]} label="Gambit Supply: " queryFn={() => getSupply(contractAddress)} />
            <Row queryKey={['currentBlock']} label="Current Block: " queryFn={() => getCurrentBlock()} refetchInterval={5000} animation={false} onDataUpdate={(data) => {
                // Store current block data and recalculate blocks left
                currentBlockRef.current = data;
                const blocks = calculateBlocksLeft();
                if (blocks) setBlocksLeft(blocks);
            }}/>

            <div style={{height: '20px'}} />
            {degenAddress && <div className={styles.item}>
                <span>{`Degen: ${displayName}`}</span>
            </div>}
            <Row queryKey={['accountBalance', degenAddress ?? '']} label="TG7T: " queryFn={() => getBalance(wagmiConfig, {address: degenAddress ?? ''})} />
            <Row queryKey={['accountGambitBalance', degenAddress ?? '']} label="GAMBIT: " queryFn={() => getBalance(wagmiConfig, {address: degenAddress ?? '', token: contractAddress})} />
            <Row queryKey={['costToSpin', degenAddress ?? '']} label="Cost to Spin: " queryFn={() => getCostToSpin(degenAddress ?? '')}  animation={false}/>
            <Row queryKey={['lastSpinBlock', degenAddress ?? '']} label="Last Spin Block: " queryFn={() => getLastSpinBlock(contractAddress, degenAddress ?? '')} animation={false} onDataUpdate={(data) => {
                // Store last spin block data and recalculate blocks left
                lastSpinBlockRef.current = data;
                const blocks = calculateBlocksLeft();
                if (blocks) setBlocksLeft(blocks);
            }}/>
            
            {/* Use Row component for blocksLeft to maintain animation */}
            <Row queryKey={['blocksLeft', degenAddress ?? '']} label="Blocks Left: " queryFn={getBlocksLeft} />
            
            <Row queryKey={['dailyStreak', degenAddress ?? '']} label="Daily Streak: " queryFn={() => getCurrentDailyStreakLength(degenAddress ?? '')} />
            <Row queryKey={['weeklyStreak', degenAddress ?? '']} label="Weekly Streak: " queryFn={() => getCurrentWeeklyStreakLength(degenAddress ?? '')} />
        </div>
    );
};

export default ContractInfo;