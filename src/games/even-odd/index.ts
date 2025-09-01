import { Game } from '../types';
import { CommandDefinition } from '../../commands/types';
import { getEvenOddAddress, isEvenOddDeployed, EvenOddABI } from '../../config/contracts';

// Placeholder components
const PlaceholderComponent = () => null;

// Placeholder game object - will be implemented in subsequent steps
export const evenOddGame: Game = {
    id: 'even-odd',
    name: 'EvenOdd',
    description: 'A blockchain-based even/odd betting game',
    version: '1.0.0',
    commands: [] as CommandDefinition<unknown>[],
    components: {
        main: PlaceholderComponent as React.ComponentType<unknown>,
        rules: PlaceholderComponent as React.ComponentType<unknown>,
        contractInfo: PlaceholderComponent as React.ComponentType<unknown>,
        stream: PlaceholderComponent as React.ComponentType<unknown>,
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
        // Deployed networks
        deployedNetworks: {
            'xai-testnet': {
                chainId: 37714555429,
                address: '0x6aEEccD5eB7f9bABA25F052d0608CC4E162786B8',
                explorer: 'https://sepolia.xaiscan.io'
            }
        }
    },
};

export default evenOddGame; 