import { contractAddress, wagmiConfig } from '../config';
import styles from './ContractInfo.module.css';
import { getBalance } from '@wagmi/core';
import { getSupply, getCurrentBlock, getCostToSpin, getCurrentDailyStreakLength, getCurrentWeeklyStreakLength, getLastSpinBlock } from '../utils/degenGambit';
import { useActiveAccount } from 'thirdweb/react';
import Row from './Row';
import { useDegenGambitInfo } from '../hooks/useDegenGambitInfo';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { privateKeyToAccount } from 'viem/accounts';
import { useAccountToUse } from '../hooks/useAccountToUse';


export const privateKey = import.meta.env.VITE_PRIVATE_KEY
const privateKeyAddress = privateKey ? privateKeyToAccount(privateKey).address : undefined

const ContractInfo = () => {
    const contractInfo = useDegenGambitInfo(contractAddress);
    const activeAccount = useActiveAccount()
    const { displayName } = useAccountToUse();
    const [degenAddress, setDegenAddress] = useState<string | undefined>(privateKeyAddress);

    useEffect(() => {
        if (activeAccount?.address && !privateKeyAddress) {
            setDegenAddress(activeAccount.address);
        }
    }, [activeAccount]);

    const queryClient = useQueryClient();

    const getBlocksLeft = async () => {
        if (!contractInfo.data?.blocksToAct) return null;
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

    // const isAccepting = useQuery({
    //     queryKey: ['isAccepting'],
    //     queryFn: () => queryClient.isMutating({mutationKey: ['accept']}) > 0
    // });
    


    return (
        <div className={styles.container}>
            <Row queryKey={['contractBalance', contractAddress]} label="Pot: " queryFn={() => getBalance(wagmiConfig, {address: contractAddress})} onDataUpdate={() => {
                queryClient.invalidateQueries({queryKey: ['degenGambitInfo', contractAddress]});
            }}/>
            <Row queryKey={['gambitSupply', contractAddress]} label="Gambit Supply: " queryFn={() => getSupply(contractAddress)} />
            <Row queryKey={['currentBlock']} label="Current Block: " queryFn={() => getCurrentBlock()} refetchInterval={5000} animation={false} onDataUpdate={() => {
                queryClient.invalidateQueries({queryKey: ['blocksLeft', activeAccount?.address ?? '']});
            }}/>

            <div style={{height: '20px'}} />
            {degenAddress && <div className={styles.item}>
                <span>{`Degen: ${displayName}`}</span>
            </div>}
            <Row queryKey={['accountBalance', degenAddress ?? '']} label="TG7T: " queryFn={() => getBalance(wagmiConfig, {address: degenAddress ?? ''})} />
            <Row queryKey={['accountGambitBalance', degenAddress ?? '']} label="GAMBIT: " queryFn={() => getBalance(wagmiConfig, {address: degenAddress ?? '', token: contractAddress})} />
            <Row queryKey={['costToSpin', degenAddress ?? '']} label="Cost to Spin: " queryFn={() => getCostToSpin(degenAddress ?? '')}  animation={false}/>
            <Row queryKey={['lastSpinBlock', degenAddress ?? '']} label="Last Spin Block: " queryFn={() => getLastSpinBlock(contractAddress, degenAddress ?? '')} animation={false} onDataUpdate={() => {
                queryClient.invalidateQueries({queryKey: ['blocksLeft', degenAddress ?? '']});
            }}/>
            <Row queryKey={['blocksLeft', degenAddress ?? '']} label="Blocks Left: " queryFn={() => getBlocksLeft()} animation={false}/>
            <Row queryKey={['dailyStreak', degenAddress ?? '']} label="Daily Streak: " queryFn={() => getCurrentDailyStreakLength(degenAddress ?? '')} />
            <Row queryKey={['weeklyStreak', degenAddress ?? '']} label="Weekly Streak: " queryFn={() => getCurrentWeeklyStreakLength(degenAddress ?? '')} />
            {/* {isAccepting.data === true && <div className={styles.item}>
                <span>{`accepting reward...`}</span>
            </div>}        */}
        </div>
    );
};

export default ContractInfo;