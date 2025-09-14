import GameStream from '../../../components/GameStream';
import { degenGambitABI } from '../../../ABIs/DegenGambit.abi.ts';
import { useDegenGambitInfo } from '../hooks/useDegenGambitInfo.ts';
import { degenGambitStreamConfig } from '../config/streamConfig';
import { degenGambitGame } from '../index';
import styles from './Stream.module.css';

const Stream: React.FC = () => {
  const contractAddress = degenGambitGame.config.contractAddress as string;
  const contractInfo = useDegenGambitInfo(contractAddress);

  return (
    <GameStream
      contractAddress={contractAddress}
      abi={degenGambitABI}
      eventConfigs={degenGambitStreamConfig}
      contractInfo={contractInfo.data}
      className={styles.container}
    />
  );
};

export default Stream;