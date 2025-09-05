import GameStream from '../../../components/GameStream';
import { contractAddress } from '../../../config/index.ts';
import { EvenOddABI } from '../EvenOdd.abi.ts';
import { evenOddStreamConfig } from '../config/streamConfig';
import styles from './Stream.module.css';

const Stream: React.FC = () => {
  // Note: This would need the actual contract info hook for even-odd
  const contractInfo = { data: null }; // Placeholder

  return (
    <GameStream
      contractAddress={contractAddress}
      abi={EvenOddABI}
      eventConfigs={evenOddStreamConfig}
      contractInfo={contractInfo.data}
      className={styles.container}
    />
  );
};

export default Stream; 