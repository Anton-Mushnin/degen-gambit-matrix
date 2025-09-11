import { Game } from '../types';
import { CommandDefinition } from '../../commands/types';
import { getEvenOddAddress, isEvenOddDeployed, EvenOddABI } from '../../config/contracts';
import { evenOddCommands } from './commands/evenOdd';
import { NETWORKS } from '../../config/networks';

// Import components
import EvenOdd from './components/EvenOdd';
import ContractInfo from './components/ContractInfo';
import Stream from './components/Stream';

// Placeholder for rules component (not needed per step 14)
const PlaceholderRules = () => null;

export const evenOddGame: Game = {
    id: 'even-odd',
    name: 'EvenOdd',
    description: 'A blockchain-based even/odd betting game',
    version: '1.0.0',
    commands: evenOddCommands as CommandDefinition<unknown>[],
    components: {
        main: EvenOdd as React.ComponentType<unknown>,
        rules: PlaceholderRules as React.ComponentType<unknown>,
        contractInfo: ContractInfo as React.ComponentType<unknown>,
        stream: Stream as React.ComponentType<unknown>,
    },
    hooks: {},
    config: {
        // Contract address helper - call getEvenOddAddress(chainId) to get address for specific network
        getContractAddress: getEvenOddAddress,
        isDeployed: isEvenOddDeployed,
        abi: EvenOddABI,
        // Contract constants
        betAmount: 1000, // WEI
        winPayout: 1400, // WEI 
        revealDelay: 3, // blocks
        // Default chain for this game
        defaultChain: 'xai-testnet',
        // Deployed networks
        deployedNetworks: {
            'xai-testnet': {
                chainId: 37714555429,
                address: '0xEf506F17e839fc646Ff61605E640e4C78D38ffCF',
                explorer: 'https://sepolia.xaiscan.io'
            }
        }
    },
    network: NETWORKS.XAI_TESTNET,
};

export default evenOddGame;
