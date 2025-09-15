import { gameRegistry } from './registry';
import { degenGambitGame } from './degen-gambit';

// Register all games
export function registerGames() {
    // Register degen-gambit
    gameRegistry.registerGame(degenGambitGame);
    // Initialize the registry
    gameRegistry.initialize({ autoLoad: true });
    
    console.log('Games registered successfully');
}

// Export for easy access
export { degenGambitGame }; 