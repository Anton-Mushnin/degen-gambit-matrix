import React from 'react';
import { Game } from '../types';
import { CommandDefinition } from '../../commands/types';
import { NETWORKS } from '../../config/networks';
import { guessNextNumberCommands } from './commands/commands';

// Import generic components
import GameMain from '../../components/GameMain';
import GameContractInfo from '../../components/GameContractInfo';

// Import configurations and functions
import { createContractData, createPlayerData, createContractConstantsData } from './info/info';
import { guessNextNumberStreamConfig } from './stream/stream';
import { guessNextNumberConfig } from './config/gameConfig';

// Import components
import { GuessNextNumberProcessingComponent, GuessNextNumberOutcomeComponent } from './components';

// Create data items wrapper for generic component
const createGuessNextNumberDataItems = ({ publicClient, activeAccount, contractAddress }: any) => {
  const contractData = createContractData({
    publicClient,
    contractAddress: contractAddress || guessNextNumberConfig.production.contractAddress,
    onDataUpdate: () => console.log('Contract data updated')
  });

  const playerAddress = activeAccount?.address;
  const playerData = playerAddress ? createPlayerData({
    publicClient,
    playerAddress,
    contractAddress: contractAddress || guessNextNumberConfig.production.contractAddress,
    onDataUpdate: () => console.log('Player data updated')
  }) : [];

  return { contractData, playerData };
};

// Create the GuessNextNumber game module
export const guessNextNumberGame: Game = {
    id: 'guess-next-number',
    name: 'Guess Next Number',
    description: 'Guess 1-6 with streak bonuses and bank investment',
    version: '1.0.0',
    commands: guessNextNumberCommands as CommandDefinition<unknown>[],
    components: {
        main: {  
            displayComponents: { 
                processingComponent: GuessNextNumberProcessingComponent,
                outcomeComponent: GuessNextNumberOutcomeComponent
            } 
        },
        contractInfo: {
            gameContractConfig: guessNextNumberConfig,
            createDataItems: createGuessNextNumberDataItems
        },
        contractConstants: {
            gameContractConfig: guessNextNumberConfig,
            createContractConstantsData: ({ publicClient, contractAddress }) => createContractConstantsData({
                publicClient,
                contractAddress
            })
        },
        stream: {
            gameContractConfig: guessNextNumberConfig,
            eventConfigs: guessNextNumberStreamConfig
        },
    },
    hooks: {},
    config: {
        contractAddress: guessNextNumberConfig.production.contractAddress,
        gameContractConfig: guessNextNumberConfig,
        privateKey: '',
        wagmiConfig: null,
    },
    network: NETWORKS.XAI_TESTNET,
};

// Create wrapper components for backward compatibility
const GuessNextNumberWrapper: React.FC = () => React.createElement(GameMain, { 
    displayComponents: { 
        processingComponent: GuessNextNumberProcessingComponent, 
        outcomeComponent: GuessNextNumberOutcomeComponent 
    } 
});
const ContractInfoWrapper: React.FC = () => React.createElement(GameContractInfo, {
    createDataItems: createGuessNextNumberDataItems
});

// Export individual components
export { GuessNextNumberWrapper as GuessNextNumber };
export { ContractInfoWrapper as ContractInfo };

export { useAccountToUse } from '../../hooks';
export { guessNextNumberCommands } from './commands/commands';
export * from './commands/handlers';

// Export TerminalOutput from matrixUI
export { TerminalOutput } from '../../components/matrixUI/TerminalOutput';

// Default export for the game module
export default guessNextNumberGame;

