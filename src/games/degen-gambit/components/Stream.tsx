import GameStream from '../../../components/GameStream';
import { contractAddress } from '../../../config/index.ts';
import { degenGambitABI } from '../../../ABIs/DegenGambit.abi.ts';
import { useDegenGambitInfo } from '../hooks/useDegenGambitInfo.ts';
import { degenGambitStreamConfig } from '../config/streamConfig';
import styles from './Stream.module.css';

const Stream: React.FC = () => {
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