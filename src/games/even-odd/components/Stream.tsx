import GameStream from '../../../components/GameStream';
import { contractAddress } from '../../../config/index.ts';
import { EvenOddABI } from '../EvenOdd.abi.ts';
import { evenOddStreamConfig } from '../config/streamConfig';
import styles from './Stream.module.css';

const Stream: React.FC = () => {

  return (
    <GameStream
      contractAddress={contractAddress}
      abi={EvenOddABI}
      eventConfigs={evenOddStreamConfig}
      className={styles.container}
    />
  );
};

export default Stream; 