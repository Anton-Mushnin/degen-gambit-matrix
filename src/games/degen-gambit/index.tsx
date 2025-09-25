import React from 'react';
import { Game } from '../types';
import { CommandDefinition } from '../../commands/types';
import { degenGambitCommands } from './commands/degenGambit';
import { NETWORKS } from '../../config/networks';

// Import generic components
import GameMain from '../../components/GameMain';
import GameContractInfo from '../../components/GameContractInfo';
import GameStream from '../../components/GameStream';

// Import DegenGambit-specific components
import RandomNumbers from './components/RandomNumbers';
import styles from './components/MatrixTerminal.module.css';

// Import configurations and functions
import { createContractData, createDegenData, privateKeyAddress } from './info';
import { degenGambitStreamConfig } from './config/streamConfig';
import { degenGambitABI } from '../../ABIs/DegenGambit.abi';

// Import hooks and context
import { DegenGambitProvider } from './contexts/DegenGambitContext';
import { useDegenGambitContext } from './contexts/DegenGambitContext';

// Create display components for different game states
const DegenGambitProcessingComponent = ({ isSpinning }: { isSpinning?: boolean }) => {
  if (!isSpinning) return null;

  return (
    <div className={styles.spinningContainer}>
      <RandomNumbers />
      <RandomNumbers />
      <RandomNumbers />
    </div>
  );
};

const DegenGambitOutcomeComponent = ({ outcome }: { outcome?: any[] }) => {
  if (!outcome || outcome.length === 0) return null;

  return (
    <div className={styles.spinningContainer}>
      {outcome.map((item: string, index: number) => (
        <RandomNumbers key={index} result={item} duration={2000 + index * 2000} />
      ))}
    </div>
  );
};

// Create data items wrapper for generic component
const createDegenGambitDataItems = ({ publicClient, activeAccount, displayName, queryClient }: any) => {
  const contractData = createContractData({
    publicClient,
    onCurrentBlockUpdate: (data: any) => {
      console.log('onCurrentBlockUpdate', data);
      queryClient?.invalidateQueries({ queryKey: ['blocksLeft', activeAccount?.address] });
    }
  });

  const degenData = createDegenData({
    publicClient,
    degenAddress: activeAccount?.address || privateKeyAddress,
    displayName,
    queryClient,
    onLastSpinBlockUpdate: () => {
      queryClient?.invalidateQueries({ queryKey: ['blocksLeft', activeAccount?.address] });
    }
  });

  return { contractData, playerData: degenData };
};

// Create the DegenGambit game module
export const degenGambitGame: Game = {
    id: 'degen-gambit',
    name: 'DegenGambit',
    description: 'A high-stakes blockchain gambling game with matrix-style interface',
    version: '1.0.0',
    commands: degenGambitCommands as CommandDefinition<unknown>[],
    components: {
        main: {
            useGameContext: useDegenGambitContext,
            displayComponents: {
                processingComponent: DegenGambitProcessingComponent,
                outcomeComponent: DegenGambitOutcomeComponent,
            },
        },
        contractInfo: {
            createDataItems: createDegenGambitDataItems
        },
        stream: {
            contractAddress: '0xE01c848c4b5e4Ac90746cd7bef27aEF23c9fcEa6',
            abi: degenGambitABI,
            eventConfigs: degenGambitStreamConfig
        },
    },
    hooks: {
    },
    context: DegenGambitProvider,
    config: {
        contractAddress: '0xE01c848c4b5e4Ac90746cd7bef27aEF23c9fcEa6',
        privateKey: '',
        wagmiConfig: null, // Will be set dynamically
    },
    network: NETWORKS.XAI_TESTNET,
};

// Create wrapper components for backward compatibility
const ContractInfoWrapper: React.FC = () => React.createElement(GameContractInfo, {
  createDataItems: createDegenGambitDataItems
});
const StreamWrapper: React.FC = () => React.createElement(GameStream, {
  contractAddress: "0xE01c848c4b5e4Ac90746cd7bef27aEF23c9fcEa6",
  abi: degenGambitABI,
  eventConfigs: degenGambitStreamConfig,
  chainId: 37714555429
});

// Export individual components and hooks for backward compatibility
const DegenGambitMainWrapper: React.FC = () => React.createElement(GameMain, {
  useGameContext: useDegenGambitContext,
  displayComponents: {
    processingComponent: DegenGambitProcessingComponent,
    outcomeComponent: DegenGambitOutcomeComponent,
  },
});
export { DegenGambitMainWrapper as DegenGambit };
export { ContractInfoWrapper as ContractInfo };
export { StreamWrapper as Stream };

export { useDegenGambitContext, DegenGambitProvider } from './contexts/DegenGambitContext';
export { useAccountToUse } from '../../hooks';

export { degenGambitCommands } from './commands/degenGambit';
export * from './commands/degenGambit.handlers';

// Export TerminalOutput from matrixUI
export { TerminalOutput } from '../../components/matrixUI/TerminalOutput';

// Default export for the game module
export default degenGambitGame; 