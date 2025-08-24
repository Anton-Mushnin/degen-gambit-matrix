import { gameRegistry } from './registry';
import { degenGambitGame } from './degen-gambit';
import { evenOddGame } from './even-odd';

// Register all games
export function registerGames() {
    // Register Even-Odd as default game
    gameRegistry.registerGame(evenOddGame);
    // Register DegenGambit
    gameRegistry.registerGame(degenGambitGame);
    
    // Initialize the registry
    gameRegistry.initialize({ autoLoad: true });
    
    console.log('Games registered successfully');
}

// Export for easy access
export { degenGambitGame, evenOddGame }; 