import { gameRegistry } from './registry';
import { degenGambitGame } from './degen-gambit';
import { diceStreakGame } from './dice-streak';
import { diceRunGame } from './dice-run';

// Register all games
export function registerGames() {
    // Register degen-gambit
    gameRegistry.registerGame(degenGambitGame);

    // Register dice-streak
    gameRegistry.registerGame(diceStreakGame);

    // Register dice-run
    gameRegistry.registerGame(diceRunGame);

    // Set dice-run as the default game
    gameRegistry.setDefaultGame('dice-run');

    // Initialize the registry
    gameRegistry.initialize({ autoLoad: true });

    console.log('Games registered successfully');
}

// Export for easy access
export { degenGambitGame, diceStreakGame, diceRunGame }; 