import { 
    CommandContext, 
    CommandDefinition, 
    CommandError, 
    CommandHandler, 
    CommandMiddleware, 
    CommandRegistry, 
    CommandResult 
} from './types';

// Game context interface for command routing
export interface GameContextForCommands {
    activeGameId: string | null;
    switchGameByName: (gameName: string) => boolean;
    getGameNames: () => string[];
    getGameCommands: () => CommandDefinition<any>[];
}

export class CommandDispatcher<T = any> {
    private registry: CommandRegistry<T> = new Map();
    private globalMiddleware: CommandMiddleware[] = [];
    private gameContext: GameContextForCommands | null = null;

    constructor() {
    }

    // Set game context for game-aware command routing
    setGameContext(gameContext: GameContextForCommands): void {
        this.gameContext = gameContext;
    }

    register(command: CommandDefinition<T>): void {
        if (command.isDefault) {
            // For default command, use a special key
            if (this.registry.has('__default__')) {
                throw new Error('Default command is already registered');
            }
            this.registry.set('__default__', command);
            return;
        }

        if (!command.pattern) {
            throw new Error('Non-default command must have a pattern');
        }

        if (this.registry.has(command.pattern.name)) {
            throw new Error(`Command '${command.pattern.name}' is already registered`);
        }
        this.registry.set(command.pattern.name, command);
    }

    // Register multiple commands at once
    registerCommands(commands: CommandDefinition<T>[]): void {
        commands.forEach(cmd => this.register(cmd));
    }

    unregister(commandName: string): void {
        this.registry.delete(commandName);
    }

    // Clear all registered commands
    clearCommands(): void {
        this.registry.clear();
    }

    use(middleware: CommandMiddleware): void {
        this.globalMiddleware.push(middleware);
    }

    private async executeMiddleware(
        context: CommandContext<T>,
        middleware: CommandMiddleware[],
        handler: CommandHandler<T>
    ): Promise<CommandResult> {
        const execute = async (index: number): Promise<CommandResult> => {
            if (index === middleware.length) {
                const result = await handler(context);

                const {isAutoCommand, input} = context;
                return {...result, autoCommand: isAutoCommand ? input : undefined};
            }

            return middleware[index](context, () => execute(index + 1));
        };

        return execute(0);
    }

    // Get all available commands (global + game-specific)
    private getAllAvailableCommands(): CommandDefinition<T>[] {
        const globalCommands = Array.from(this.registry.values());
        const gameCommands = this.gameContext?.getGameCommands() || [];
        return [...globalCommands, ...gameCommands];
    }

    async dispatch(input: string, params: T): Promise<CommandResult> {
        const context: CommandContext<T> = { input, params };

        try {
            // First check if it's a game switching command
            if (this.gameContext) {
                const gameNames = this.gameContext.getGameNames();
                const inputLower = input.toLowerCase().trim();
                
                // Check if input matches a game name
                if (gameNames.some(name => name.toLowerCase() === inputLower)) {
                    const success = this.gameContext.switchGameByName(input);
                    if (success) {
                        return {
                            output: [`Switched to game: ${input}`]
                        };
                    } else {
                        return {
                            output: [`Failed to switch to game: ${input}`]
                        };
                    }
                }
            }

            // Get all available commands (global + current game)
            const allCommands = this.getAllAvailableCommands();

            // Find matching command
            for (const command of allCommands) {
                if (command.isDefault) continue; // Skip default command in normal search
                if (command.pattern?.pattern.test(input)) {
                    const allMiddleware = [
                        ...this.globalMiddleware,
                        ...(command.middleware || [])
                    ];
                    const result = await this.executeMiddleware(
                        {...context, isAutoCommand: command.isAutoCommand},
                        allMiddleware,
                        command.handler
                    );
                    return result;
                }
            }

            // If no command found, try default command from global registry first
            const defaultCommand = this.registry.get('__default__');
            if (defaultCommand) {
                const allMiddleware = [
                    ...this.globalMiddleware,
                    ...(defaultCommand.middleware || [])
                ];
                return this.executeMiddleware(
                    context,
                    allMiddleware,
                    defaultCommand.handler
                );
            }

            // Try default command from current game
            if (this.gameContext) {
                const gameCommands = this.gameContext.getGameCommands();
                const gameDefaultCommand = gameCommands.find(cmd => cmd.isDefault);
                if (gameDefaultCommand) {
                    const allMiddleware = [
                        ...this.globalMiddleware,
                        ...(gameDefaultCommand.middleware || [])
                    ];
                    return this.executeMiddleware(
                        context,
                        allMiddleware,
                        gameDefaultCommand.handler
                    );
                }
            }

            // No command and no default handler found
            const availableCommands = this.getAvailableCommandsList();
            return {
                output: [
                    `Command not found: ${input}`,
                    '',
                    'Available commands:',
                    ...availableCommands,
                    '',
                    this.gameContext ? `Current game: ${this.gameContext.activeGameId || 'none'}` : 'No game context'
                ]
            };
        } catch (error) {
            const commandError = error as CommandError;
            return {
                output: [
                    `Error: ${commandError.message}`,
                    commandError.details ? `Details: ${JSON.stringify(commandError.details)}` : '',
                ].filter(Boolean)
            };
        }
    }

    // Get a formatted list of available commands
    private getAvailableCommandsList(): string[] {
        const commands: string[] = [];
        
        // Global commands
        const globalCommands = Array.from(this.registry.values())
            .filter(cmd => !cmd.isDefault && cmd.pattern)
            .map(cmd => `• ${cmd.pattern!.name}: ${cmd.pattern!.description}`);
        
        if (globalCommands.length > 0) {
            commands.push('Global commands:');
            commands.push(...globalCommands);
        }

        // Game commands
        if (this.gameContext) {
            const gameCommands = this.gameContext.getGameCommands()
                .filter(cmd => !cmd.isDefault && cmd.pattern)
                .map(cmd => `• ${cmd.pattern!.name}: ${cmd.pattern!.description}`);
            
            if (gameCommands.length > 0) {
                commands.push('', `Current game commands (${this.gameContext.activeGameId}):`);
                commands.push(...gameCommands);
            }

            // Available games
            const gameNames = this.gameContext.getGameNames();
            if (gameNames.length > 0) {
                commands.push('', 'Available games:');
                commands.push(...gameNames.map(name => `• ${name}: Switch to ${name} game`));
            }
        }

        return commands;
    }

    getCommands(): CommandDefinition<T>[] {
        return Array.from(this.registry.values());
    }
} 