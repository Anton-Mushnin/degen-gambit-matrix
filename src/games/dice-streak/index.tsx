import React from 'react';
import { Game } from '../types';
import { CommandDefinition } from '../../commands/types';
import { diceStreakCommands } from './commands/diceStreak';
import { NETWORKS } from '../../config/networks';

// Import generic components
import GameMain from '../../components/GameMain';
import GameContractInfo from '../../components/GameContractInfo';
import GameStream from '../../components/GameStream';

// Import configurations and functions
import { createContractData, createPlayerData, privateKeyAddress } from './info';
import { diceStreakStreamConfig } from './config/streamConfig';
import { diceStreakABI } from '../../ABIs/DiceStreak.abi';

// Create data items wrapper for generic component
const createDiceStreakDataItems = ({ publicClient, activeAccount }: any) => {
  const contractData = createContractData({
    publicClient,
    onDataUpdate: () => console.log('Contract data updated')
  });

  const playerAddress = activeAccount?.address || privateKeyAddress;
  const playerData = playerAddress ? createPlayerData({
    publicClient,
    playerAddress,
    onDataUpdate: () => console.log('Player data updated')
  }) : [];

  return { contractData, playerData };
};

// Import hooks and context
import { DiceStreakProvider } from './contexts/DiceStreakContext';
import { useDiceStreakContext } from './contexts/DiceStreakContext';

// Import components
import { DiceStreakProcessingComponent } from './components';


// Create the DiceStreak game module
export const diceStreakGame: Game = {
    id: 'dice-streak',
    name: 'Dice Streak',
    description: 'A dice guessing game with streak bonuses and combo rewards',
    version: '1.0.0',
    commands: diceStreakCommands as CommandDefinition<unknown>[],
    components: {
        main: { useGameContext: useDiceStreakContext, 
                displayComponents: { processingComponent: DiceStreakProcessingComponent } 
              },
        contractInfo: {
            createDataItems: createDiceStreakDataItems
        },
        stream: {
            contractAddress: '0x874b7ebEE68624303aBA0D09eFd2EA3ee8385080',
            abi: diceStreakABI,
            eventConfigs: diceStreakStreamConfig
        },
    },
    hooks: {
    },
    context: DiceStreakProvider,
    config: {
        contractAddress: '0x874b7ebEE68624303aBA0D09eFd2EA3ee8385080',
        privateKey: '',
        wagmiConfig: null, // Will be set dynamically
    },
    network: NETWORKS.XAI_TESTNET,
};

// Create wrapper components for backward compatibility
const DiceStreakWrapper: React.FC = () => React.createElement(GameMain, { useGameContext: useDiceStreakContext, displayComponents: { processingComponent: DiceStreakProcessingComponent } });
const ContractInfoWrapper: React.FC = () => React.createElement(GameContractInfo, {
  createDataItems: createDiceStreakDataItems
});
const StreamWrapper: React.FC = () => React.createElement(GameStream, {
  contractAddress: "0x874b7ebEE68624303aBA0D09eFd2EA3ee8385080",
  abi: diceStreakABI,
  eventConfigs: diceStreakStreamConfig,
  chainId: 37714555429
});

// Export individual components and hooks for backward compatibility
export { DiceStreakWrapper as DiceStreak };
export { ContractInfoWrapper as ContractInfo };
export { StreamWrapper as Stream };

export { useDiceStreakContext, DiceStreakProvider } from './contexts/DiceStreakContext';
export { useAccountToUse } from '../../hooks';

export { diceStreakCommands } from './commands/diceStreak';
export * from './commands/diceStreak.handlers';

// Export TerminalOutput from matrixUI
export { TerminalOutput } from '../../components/matrixUI/TerminalOutput';

// Default export for the game module
export default diceStreakGame;
