import { diceStreakGame } from '..';
import GameStream from '../../../components/GameStream';
import { diceStreakStreamConfig } from '../config/streamConfig';
import { diceStreakABI } from '../../../ABIs/DiceStreak.abi';


const Stream: React.FC = () => {
  return (
    <GameStream
      contractAddress={diceStreakGame.config.contractAddress as string}
      abi={diceStreakABI}
      eventConfigs={diceStreakStreamConfig}
    />
  );
};

export default Stream;
