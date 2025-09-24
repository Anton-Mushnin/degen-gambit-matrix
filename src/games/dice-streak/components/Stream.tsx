import { diceStreakGame } from '..';
import GameStream from '../../../components/GameStream';
import { diceStreakStreamConfig } from '../config/streamConfig';

// Define DiceStreak ABI for events
const diceStreakABI = [
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "player", "type": "address"},
      {"indexed": false, "internalType": "uint8", "name": "guess", "type": "uint8"},
      {"indexed": false, "internalType": "uint8", "name": "result", "type": "uint8"},
      {"indexed": false, "internalType": "uint256", "name": "payout", "type": "uint256"}
    ],
    "name": "PlayerWin",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "player", "type": "address"},
      {"indexed": false, "internalType": "uint8", "name": "guess", "type": "uint8"},
      {"indexed": false, "internalType": "uint8", "name": "result", "type": "uint8"},
      {"indexed": false, "internalType": "uint256", "name": "basePayout", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "bonusPayout", "type": "uint256"},
      {"indexed": false, "internalType": "string", "name": "comboType", "type": "string"}
    ],
    "name": "PlayerWinWithCombo",
    "type": "event"
  }
] as const;


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
