import { Game } from '../types';
import { CommandDefinition } from '../../commands/types';

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
        contractAddress: '',
    },
};

export default evenOddGame; 