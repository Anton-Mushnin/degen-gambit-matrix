import { DataItem } from '../games/types';
import ValueRow from './matrixUI/ValueRow';
import QueryValueRow from './matrixUI/QueryValueRow';
import QueryValueTable from './matrixUI/QueryValueTable';
import styles from '../games/even-odd/components/ContractInfo.module.css';

import { useBlockchain } from '../hooks';

export interface GameContractConstantsProps {
  createContractConstantsData: (params: {
    publicClient: any;
    contractAddress?: string;
    contractABI?: any;
  }) => DataItem[];
}

const GameContractConstants: React.FC<GameContractConstantsProps> = ({
  createContractConstantsData
}) => {
  const { publicClient } = useBlockchain();

  // For constants, we need publicClient to read from contract
  const constantsData = publicClient ? createContractConstantsData({
    publicClient,
    contractAddress: undefined,
    contractABI: undefined
  }) : [];

  return (
    <div className={styles.container}>
      {constantsData.map((item, index) => (
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

export default GameContractConstants;
