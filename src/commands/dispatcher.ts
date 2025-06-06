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
                if (command.isDefault) continue; // Skip default command in normal search
                if (command.pattern?.pattern.test(input)) {
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

            // If no command found, try default command
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

            // No command and no default handler found
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