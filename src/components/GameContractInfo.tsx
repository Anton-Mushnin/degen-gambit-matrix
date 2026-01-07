import { useQueryClient } from '@tanstack/react-query';
import { useActiveAccount } from 'thirdweb/react';

import { useAccountToUse, useBlockchain } from '../hooks';
import { useDevMode } from '../contexts/DevModeContext';
import { DataItem } from '../games/types';
import QueryValueRow from './matrixUI/QueryValueRow';
import QueryValueTable from './matrixUI/QueryValueTable';
import ValueRow from './matrixUI/ValueRow';
import styles from '../games/even-odd/components/ContractInfo.module.css';

export interface GameContractInfoProps {
  createDataItems: (params: {
    publicClient: any;
    activeAccount?: any;
    displayName?: string;
    queryClient?: any;
    privateKeyAddress?: string;
  }) => { contractData: DataItem[]; playerData: DataItem[] };
}

const GameContractInfo: React.FC<GameContractInfoProps> = ({
  createDataItems
}) => {
  const activeAccount = useActiveAccount();
  const { displayName } = useAccountToUse();
  const { publicClient } = useBlockchain();
  const queryClient = useQueryClient();
  const { isDevMode } = useDevMode();

  const { contractData, playerData } = publicClient ? createDataItems({
    publicClient,
    activeAccount,
    displayName,
    queryClient
  }) : { contractData: [], playerData: [] };

  return (
    <div className={styles.container}>
      {isDevMode && (
        <ValueRow
          type="static"
          label="Mode"
          data={{
            formatted: "Dev mode on",
            value: BigInt(1),
            decimals: 0
          }}
          animation={false}
        />
      )}
      {contractData.map((item, index) => (
        item.type === 'query' ? (
          item.tableQueryFn ? (
            <QueryValueTable
              key={index}
              label={item.label}
              headers={item.headers || []}
              queryKey={item.queryKey}
              queryFn={item.tableQueryFn}
              refetchInterval={item.refetchInterval}
              animation={item.animation}
              onDataUpdate={item.onDataUpdate}
            />
          ) : (
            <QueryValueRow
              key={index}
              label={item.label}
              queryKey={item.queryKey}
              queryFn={item.queryFn}
              refetchInterval={item.refetchInterval}
              animation={item.animation}
              onDataUpdate={item.onDataUpdate}
            />
          )
        ) : (
          <ValueRow
            type={item.type}
            key={index}
            label={item.label}
            data={item.data}
            animation={item.animation}
          />
        )
      ))}
      <div className={styles.separator} />
      {playerData.map((item, index) => (
        item.type === 'query' ? (
          item.tableQueryFn ? (
            <QueryValueTable
              key={index}
              label={item.label}
              headers={item.headers || []}
              queryKey={item.queryKey}
              queryFn={item.tableQueryFn}
              refetchInterval={item.refetchInterval}
              animation={item.animation}
              onDataUpdate={item.onDataUpdate}
            />
          ) : (
            <QueryValueRow
              key={index}
              label={item.label}
              queryKey={item.queryKey}
              queryFn={item.queryFn}
              refetchInterval={item.refetchInterval}
              animation={item.animation}
              onDataUpdate={item.onDataUpdate}
            />
          )
        ) : (
          <ValueRow
            type={item.type}
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

export default GameContractInfo;
