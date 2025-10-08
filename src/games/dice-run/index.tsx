import React from 'react';
import { Game } from '../types';
import { CommandDefinition } from '../../commands/types';
import { NETWORKS } from '../../config/networks';
import { diceRunCommands } from './commands/commands';

// Import generic components
import GameMain from '../../components/GameMain';
import GameContractInfo from '../../components/GameContractInfo';

// Import configurations and functions
import { createContractData, createPlayerData, privateKeyAddress } from './info/info';
import { diceRunStreamConfig } from './stream/stream';
import { diceRunConfig } from './config/gameConfig';

// Create data items wrapper for generic component
const createDiceRunDataItems = ({ publicClient, activeAccount, contractAddress }: any) => {
  const contractData = createContractData({
    publicClient,
    contractAddress: contractAddress || (diceRunConfig.production.contractAddress), // Use passed address or fallback
    onDataUpdate: () => console.log('Contract data updated')
  });

  const playerAddress = activeAccount?.address || privateKeyAddress;
  const playerData = playerAddress ? createPlayerData({
    publicClient,
    playerAddress,
    contractAddress: contractAddress || (diceRunConfig.production.contractAddress), // Use passed address or fallback
    onDataUpdate: () => console.log('Player data updated')
  }) : [];

  return { contractData, playerData };
};


// Import components
import { DiceStreakProcessingComponent, DiceStreakOutcomeComponent } from './components';


// Create the DiceRun game module

export const diceRunGame: Game = {
    id: 'dice-run',
    name: 'Dice Run',
    description: 'A dice guessing game with streak bonuses and bank ownership',
    version: '1.0.0',
    commands: diceRunCommands as CommandDefinition<unknown>[],
    components: {
        main: {
                displayComponents: {
                    processingComponent: DiceStreakProcessingComponent,
                    outcomeComponent: DiceStreakOutcomeComponent
                }
              },
        contractInfo: {
            gameContractConfig: diceRunConfig,
            createDataItems: createDiceRunDataItems
        },
        stream: {
            gameContractConfig: diceRunConfig,
            eventConfigs: diceRunStreamConfig
        },
    },
    hooks: {
    },
    config: {
        contractAddress: '0x6F69eDa03a207bfbBb14bAB1569034C7a2Cb3eC7', // Legacy fallback
        gameContractConfig: diceRunConfig, // New dev mode aware config
        privateKey: '',
        wagmiConfig: null, // Will be set dynamically
    },
    network: NETWORKS.XAI_TESTNET,
};

// Create wrapper components for backward compatibility
const DiceRunWrapper: React.FC = () => React.createElement(GameMain, { displayComponents: { processingComponent: DiceStreakProcessingComponent, outcomeComponent: DiceStreakOutcomeComponent } });
const ContractInfoWrapper: React.FC = () => React.createElement(GameContractInfo, {
  createDataItems: createDiceRunDataItems
});
// StreamWrapper removed - use Home.tsx dev mode aware rendering instead

// Export individual components and hooks for backward compatibility
export { DiceRunWrapper as DiceRun };
export { ContractInfoWrapper as ContractInfo };
// Stream export removed - use Home.tsx dev mode aware rendering instead

export { useAccountToUse } from '../../hooks';

export { diceRunCommands } from './commands/commands';
export * from './commands/diceRun.handlers';

// Export TerminalOutput from matrixUI
export { TerminalOutput } from '../../components/matrixUI/TerminalOutput';

// Default export for the game module
export default diceRunGame;
