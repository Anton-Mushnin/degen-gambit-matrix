import React from 'react';
import { Game } from '../types';
import { CommandDefinition } from '../../commands/types';
import { NETWORKS } from '../../config/networks';
import { diceStreakCommands } from './commands/commands';

// Import generic components
import GameMain from '../../components/GameMain';
import GameContractInfo from '../../components/GameContractInfo';

// Import configurations and functions
import { createContractData, createPlayerData, createContractConstantsData, privateKeyAddress } from './info/info';
import { diceStreakStreamConfig } from './stream/stream';
import { diceStreakConfig } from './config/gameConfig';

// Create data items wrapper for generic component
const createDiceStreakDataItems = ({ publicClient, activeAccount, contractAddress }: any) => {
  const contractData = createContractData({
    publicClient,
    contractAddress: contractAddress || (diceStreakConfig.production.contractAddress), // Use passed address or fallback
    onDataUpdate: () => console.log('Contract data updated')
  });

  const playerAddress = activeAccount?.address || privateKeyAddress;
  const playerData = playerAddress ? createPlayerData({
    publicClient,
    playerAddress,
    contractAddress: contractAddress || (diceStreakConfig.production.contractAddress), // Use passed address or fallback
    onDataUpdate: () => console.log('Player data updated')
  }) : [];

  return { contractData, playerData };
};


// Import components
import { DiceStreakProcessingComponent, DiceStreakOutcomeComponent } from './components';


// Create the DiceStreak game module

export const diceStreakGame: Game = {
    id: 'dice-streak',
    name: 'Dice Streak',
    description: 'A dice guessing game with streak bonuses and combo rewards',
    version: '1.0.0',
    commands: diceStreakCommands as CommandDefinition<unknown>[],
    components: {
        main: {  
                displayComponents: { 
                    processingComponent: DiceStreakProcessingComponent,
                    outcomeComponent: DiceStreakOutcomeComponent
                } 
              },
        contractInfo: {
            gameContractConfig: diceStreakConfig,
            createDataItems: createDiceStreakDataItems
        },
        contractConstants: {
            gameContractConfig: diceStreakConfig,
            createContractConstantsData: ({ publicClient, contractAddress }) => createContractConstantsData({
                publicClient,
                contractAddress
            })
        },
        stream: {
            gameContractConfig: diceStreakConfig,
            eventConfigs: diceStreakStreamConfig
        },
    },
    hooks: {
    },
    config: {
        contractAddress: '0x2E1C39c9475C62f17493ABaFaFf90eD01640ce51', // Legacy fallback
        gameContractConfig: diceStreakConfig, // New dev mode aware config
        privateKey: '',
        wagmiConfig: null, // Will be set dynamically
    },
    network: NETWORKS.XAI_TESTNET,
};

// Create wrapper components for backward compatibility
const DiceStreakWrapper: React.FC = () => React.createElement(GameMain, { displayComponents: { processingComponent: DiceStreakProcessingComponent, outcomeComponent: DiceStreakOutcomeComponent } });
const ContractInfoWrapper: React.FC = () => React.createElement(GameContractInfo, {
  createDataItems: createDiceStreakDataItems
});
// StreamWrapper removed - use Home.tsx dev mode aware rendering instead

// Export individual components and hooks for backward compatibility
export { DiceStreakWrapper as DiceStreak };
export { ContractInfoWrapper as ContractInfo };
// Stream export removed - use Home.tsx dev mode aware rendering instead

export { useAccountToUse } from '../../hooks';

export { diceStreakCommands } from './commands/commands';
export * from './commands/diceStreak.handlers';

// Export TerminalOutput from matrixUI
export { TerminalOutput } from '../../components/matrixUI/TerminalOutput';

// Default export for the game module
export default diceStreakGame;
