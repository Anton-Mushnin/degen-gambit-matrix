import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useActiveAccount } from 'thirdweb/react';

import { useAccountToUse, useBlockchain } from '../../../hooks';
import { createContractData, createDegenData, privateKeyAddress } from '../info';
import { degenGambitGame } from '../index';
import QueryValueRow from '../../../components/matrixUI/QueryValueRow';
import ValueRow from '../../../components/matrixUI/ValueRow';
import styles from './ContractInfo.module.css';

const ContractInfo = () => {
    const activeAccount = useActiveAccount();
    const { displayName } = useAccountToUse();
    const { publicClient } = useBlockchain();
    const [degenAddress, setDegenAddress] = useState<string | undefined>(privateKeyAddress);
    const queryClient = useQueryClient();

    // Set degen address from active account
    useEffect(() => {
        if (activeAccount?.address && !privateKeyAddress) {
            setDegenAddress(activeAccount.address);
        }
    }, [activeAccount]);

    const contractData = publicClient ? createContractData({
        publicClient,
        onCurrentBlockUpdate: (data) => {
            console.log('onCurrentBlockUpdate', data);
            queryClient.invalidateQueries({queryKey: ['blocksLeft', degenAddress]});
        }
    }) : [];

    const degenData = publicClient ? createDegenData({
        publicClient,
        degenAddress,
        displayName,
        queryClient,
        onLastSpinBlockUpdate: () => {
            queryClient.invalidateQueries({queryKey: ['blocksLeft', degenAddress]});
        }
    }) : [];

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