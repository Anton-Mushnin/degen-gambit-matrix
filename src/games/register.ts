import { gameRegistry } from './registry';
import { degenGambitGame } from './degen-gambit';
import { diceStreakGame } from './dice-streak';

// Register all games
export function registerGames() {
    // Register degen-gambit
    gameRegistry.registerGame(degenGambitGame);

    // Register dice-streak
    gameRegistry.registerGame(diceStreakGame);

    // Set dice-streak as the default game
    gameRegistry.setDefaultGame('dice-streak');

    // Initialize the registry
    gameRegistry.initialize({ autoLoad: true });

    console.log('Games registered successfully');
}

// Export for easy access
export { degenGambitGame, diceStreakGame }; 