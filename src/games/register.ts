import { gameRegistry } from './registry';
import { degenGambitGame } from './degen-gambit';
import { diceStreakGame } from './dice-streak';
import { guessNextNumberGame } from './GuessNextNumber';

// Register all games
export function registerGames() {
    // Register degen-gambit
    gameRegistry.registerGame(degenGambitGame);

    // Register dice-streak
    gameRegistry.registerGame(diceStreakGame);

    // Register guess-next-number
    gameRegistry.registerGame(guessNextNumberGame);

    // Set guess-next-number as the default game
    gameRegistry.setDefaultGame('guess-next-number');

    // Initialize the registry
    gameRegistry.initialize({ autoLoad: true });

    console.log('Games registered successfully');
}

// Export for easy access
export { degenGambitGame, diceStreakGame, guessNextNumberGame }; 