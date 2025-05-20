import { 
    CommandContext, 
    CommandDefinition, 
    CommandError, 
    CommandHandler, 
    CommandMiddleware, 
    CommandRegistry, 
    CommandResult 
} from './types';

export class CommandDispatcher<T = any> {
    private registry: CommandRegistry<T> = new Map();
    private globalMiddleware: CommandMiddleware[] = [];

    constructor() {
    }

    register(command: CommandDefinition<T>): void {
        if (this.registry.has(command.pattern.name)) {
            throw new Error(`Command '${command.pattern.name}' is already registered`);
        }
        this.registry.set(command.pattern.name, command);
    }

    unregister(commandName: string): void {
        this.registry.delete(commandName);
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
                return handler(context);
            }

            return middleware[index](context, () => execute(index + 1));
        };

        return execute(0);
    }

    async dispatch(input: string, params: T): Promise<CommandResult> {
        const context: CommandContext<T> = { input, params };

        try {
            // Find matching command
            for (const command of this.registry.values()) {
                if (command.pattern.pattern.test(input)) {
                    const allMiddleware = [
                        ...this.globalMiddleware,
                        ...(command.middleware || [])
                    ];

                    return this.executeMiddleware(
                        context,
                        allMiddleware,
                        command.handler
                    );
                }
            }

            // No command found
            return {
                output: [
                    `Command not found: ${input}`,
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

    getCommands(): CommandDefinition<T>[] {
        return Array.from(this.registry.values());
    }
} 