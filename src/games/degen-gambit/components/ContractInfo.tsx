import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useActiveAccount } from 'thirdweb/react';

import { useAccountToUse } from '../../../hooks';
import useBlocksLeft from '../../../hooks/useBlocksLeft';
import { useDegenGambitInfo } from '../hooks/useDegenGambitInfo';
import { createContractData, createDegenData, privateKeyAddress } from '../info';
import { degenGambitGame } from '../index';
import QueryValueRow from '../../../components/matrixUI/QueryValueRow';
import ValueRow from '../../../components/matrixUI/ValueRow';
import styles from './ContractInfo.module.css';

const ContractInfo = () => {
    const contractAddress = degenGambitGame.config.contractAddress as string;
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

    const contractData = createContractData(
        () => {
            queryClient.invalidateQueries({queryKey: ['degenGambitInfo', contractAddress]});
        },
        handleCurrentBlockUpdate
    );

    const degenData = createDegenData(
        degenAddress,
        displayName,
        getBlocksLeft,
        blocksLeft,
        handleCurrentBlockUpdate,
        handleLastSpinBlockUpdate
    );

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