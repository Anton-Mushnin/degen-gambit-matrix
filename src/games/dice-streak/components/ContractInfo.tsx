import { useEffect, useState } from 'react';
import { useActiveAccount } from 'thirdweb/react';

import { useBlockchain } from '../../../hooks';
import { createContractData, createPlayerData, privateKeyAddress } from '../info';
import QueryValueRow from '../../../components/matrixUI/QueryValueRow';
import ValueRow from '../../../components/matrixUI/ValueRow';
import styles from './ContractInfo.module.css';

const ContractInfo = () => {
    const activeAccount = useActiveAccount();
    const { publicClient } = useBlockchain();
    const [dicePlayerAddress, setDicePlayerAddress] = useState<string | undefined>(privateKeyAddress);

    // Set dice player address from active account
    useEffect(() => {
        if (activeAccount?.address && !privateKeyAddress) {
            setDicePlayerAddress(activeAccount.address);
        }
    }, [activeAccount]);

    const contractData = publicClient ? createContractData({
        publicClient,
        onDataUpdate: () => {
            console.log('Contract data updated');
        }
    }) : [];

    const playerData = publicClient && dicePlayerAddress ? createPlayerData({
        publicClient,
        playerAddress: dicePlayerAddress,
        onDataUpdate: () => {
            console.log('Player data updated');
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
