import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useActiveAccount } from 'thirdweb/react';

import { useAccountToUse } from '../../../hooks';
import { createContractData, createPlayerData, privateKeyAddress } from '../info';
import QueryValueRow from '../../../components/matrixUI/QueryValueRow';
import ValueRow from '../../../components/matrixUI/ValueRow';
import styles from './ContractInfo.module.css';

const ContractInfo = () => {
    const activeAccount = useActiveAccount();
    const { displayName } = useAccountToUse();
    const [playerAddress, setPlayerAddress] = useState<string | undefined>(privateKeyAddress);
    const queryClient = useQueryClient();
    
    // Set player address from active account
    useEffect(() => {
        if (activeAccount?.address && !privateKeyAddress) {
            setPlayerAddress(activeAccount.address);
        }
    }, [activeAccount]);

    const contractData = createContractData(
        () => {
            // Invalidate contract-related queries when contract data updates
            queryClient.invalidateQueries({queryKey: ['potBalance']});
            queryClient.invalidateQueries({queryKey: ['betAmount']});
            queryClient.invalidateQueries({queryKey: ['payoutAmount']});
        }
    );

    const playerData = createPlayerData(
        playerAddress,
        displayName,
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
            {playerData.map((item, index) => (
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