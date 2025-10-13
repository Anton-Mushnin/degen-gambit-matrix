import { Game, GameState, GameInitOptions } from './types';

// Game registry class to manage all available games
class GameRegistry {
    private games: Map<string, Game> = new Map();
    private defaultGameId: string | null = null;

    // Register a new game
    registerGame(game: Game): void {
        if (this.games.has(game.id)) {
            console.warn(`Game with id '${game.id}' is already registered. Overwriting...`);
        }
        this.games.set(game.id, game);
        
        // Set as default if it's the first game
        if (this.defaultGameId === null) {
            this.defaultGameId = game.id;
        }
    }

    // Get a game by ID
    getGame(gameId: string): Game | undefined {
        return this.games.get(gameId);
    }

    // Get all available games
    getAllGames(): Game[] {
        return Array.from(this.games.values());
    }

    // Set default game
    setDefaultGame(gameId: string): void {
        if (this.games.has(gameId)) {
            this.defaultGameId = gameId;
            console.log(`Default game set to: ${gameId}`);
        } else {
            console.warn(`Cannot set default game to '${gameId}': game not found`);
        }
    }

    // Get default game
    getDefaultGame(): Game | null {
        if (this.defaultGameId) {
            return this.games.get(this.defaultGameId) || null;
        }
        return null;
    }

    // Check if a game exists
    hasGame(gameId: string): boolean {
        return this.games.has(gameId);
    }

    // Get game names for listing
    getGameNames(): string[] {
        return Array.from(this.games.keys());
    }

    // Initialize the registry with games
    initialize(options: GameInitOptions = {}): void {
        // This will be called after all games are registered
        console.log(`Game registry initialized with ${this.games.size} games`);
        
        if (options.autoLoad && this.defaultGameId) {
            console.log(`Default game: ${this.defaultGameId}`);
        }
    }

    // Get initial game state
    getInitialState(): GameState {
        const defaultGame = this.getDefaultGame();
        return {
            activeGame: defaultGame,
            availableGames: this.getAllGames(),
            gameHistory: defaultGame ? [defaultGame.id] : []
        };
    }

    // Validate game structure
    validateGame(game: Game): boolean {
        const requiredFields = ['id', 'name', 'description', 'version', 'commands', 'components'];
        const missingFields = requiredFields.filter(field => !(field in game));
        
        if (missingFields.length > 0) {
            console.error(`Game validation failed for '${game.id}'. Missing fields:`, missingFields);
            return false;
        }
        
        if (!game.components.main) {
            console.error(`Game '${game.id}' must have a main component`);
            return false;
        }
        
        return true;
    }

    // Get game by name (case-insensitive)
    getGameByName(name: string): Game | undefined {
        const normalizedName = name.toLowerCase();
        return Array.from(this.games.values()).find(
            game => game.name.toLowerCase() === normalizedName || game.id.toLowerCase() === normalizedName
        );
    }
}

// Export singleton instance
export const gameRegistry = new GameRegistry();

// Export the class for testing purposes
export { GameRegistry }; 