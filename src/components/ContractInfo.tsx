import { contractAddress, wagmiConfig } from '../config';
import styles from './ContractInfo.module.css';
import { getBalance } from '@wagmi/core';
import { getSupply, getCurrentBlock, getCostToSpin, getCurrentDailyStreakLength, getCurrentWeeklyStreakLength, getLastSpinBlock } from '../utils/degenGambit';
import { useActiveAccount } from 'thirdweb/react';
import Row from './Row';
import { useDegenGambitInfo } from '../hooks/useDegenGambitInfo';
import { useQueryClient } from '@tanstack/react-query';

const ContractInfo = () => {
    const contractInfo = useDegenGambitInfo(contractAddress);
    const activeAccount = useActiveAccount()
    

    const queryClient = useQueryClient();

    const getBlocksLeft = async () => {
        if (!contractInfo.data?.blocksToAct) return;
        const currentBlock = queryClient.getQueryData(['currentBlock']) as {value: bigint, formatted: string, decimals: number};
        const lastSpinBlock = queryClient.getQueryData(['lastSpinBlock', activeAccount?.address ?? '']) as {value: bigint, formatted: string, decimals: number};
        const deadline = lastSpinBlock.value + BigInt(contractInfo.data?.blocksToAct);
        const blocksLeft = Math.max(Math.min(Number(deadline - currentBlock.value), contractInfo.data?.blocksToAct), 0);
        if (blocksLeft === 0) {
            queryClient.invalidateQueries({queryKey: ['costToSpin']});
        }   
        return {
            value: BigInt(blocksLeft),
            formatted: blocksLeft.toString(),
            decimals: 0,
        };
    }


    return (
        <div className={styles.container}>
            <Row queryKey={['contractBalance', contractAddress]} label="Pot: " queryFn={() => getBalance(wagmiConfig, {address: contractAddress})} />
            <Row queryKey={['gambitSupply', contractAddress]} label="Gambit Supply: " queryFn={() => getSupply(contractAddress)} />
            <Row queryKey={['currentBlock']} label="Current Block: " queryFn={() => getCurrentBlock()} refetchInterval={5000} animation={false} onDataUpdate={() => {
                queryClient.invalidateQueries({queryKey: ['blocksLeft', activeAccount?.address ?? '']});
            }}/>

            <div style={{height: '20px'}} />
            <div className={styles.item}>
                <span>{`Degen ${activeAccount?.address.slice(0, 6)}...${activeAccount?.address.slice(-4)}`}</span>
            </div>
            <Row queryKey={['accountBalance', activeAccount?.address ?? '']} label="TG7T: " queryFn={() => getBalance(wagmiConfig, {address: activeAccount?.address ?? ''})} />
            <Row queryKey={['accountGambitBalance', activeAccount?.address ?? '']} label="GAMBIT: " queryFn={() => getBalance(wagmiConfig, {address: activeAccount?.address ?? '', token: contractAddress})} />
            <Row queryKey={['costToSpin', activeAccount?.address ?? '']} label="Cost to Spin: " queryFn={() => getCostToSpin(activeAccount?.address ?? '')}  animation={false}/>
            <Row queryKey={['lastSpinBlock', activeAccount?.address ?? '']} label="Last Spin Block: " queryFn={() => getLastSpinBlock(contractAddress, activeAccount?.address ?? '')} animation={false} onDataUpdate={() => {
                queryClient.invalidateQueries({queryKey: ['blocksLeft', activeAccount?.address ?? '']});
            }}/>
            <Row queryKey={['blocksLeft', activeAccount?.address ?? '']} label="Blocks Left: " queryFn={() => getBlocksLeft()} animation={false}/>
            <Row queryKey={['dailyStreak', activeAccount?.address ?? '']} label="Daily Streak: " queryFn={() => getCurrentDailyStreakLength(activeAccount?.address ?? '')} />
            <Row queryKey={['weeklyStreak', activeAccount?.address ?? '']} label="Weekly Streak: " queryFn={() => getCurrentWeeklyStreakLength(activeAccount?.address ?? '')} />
                    
        </div>
    );
};

export default ContractInfo;