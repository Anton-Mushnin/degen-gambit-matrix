import GameStream from '../../../components/GameStream';
import { degenGambitABI } from '../../../ABIs/DegenGambit.abi.ts';
import { degenGambitStreamConfig } from '../config/streamConfig';
import { degenGambitGame } from '../index';
import styles from './Stream.module.css';

const Stream: React.FC = () => {
  const contractAddress = degenGambitGame.config.contractAddress as string;

  return (
    <GameStream
      contractAddress={contractAddress}
      abi={degenGambitABI}
      eventConfigs={degenGambitStreamConfig}
      className={styles.container}
    />
  );
};

export default Stream;