export type CommandResult = {
    output?: string[]; // Output text to display in the terminal
    outcome?: string[]; //Outcome text to display in the terminal
    isPrize?: boolean; //If the outcome is a prize
    autoCommand?: string; //If the command is auto, the input command
    queriesToInvalidate?: string[]; // Query keys to invalidate after command execution
};

export type CommandContext<T = any> = {
    input: string;
    params: T;
    isAutoCommand?: boolean;
};

export type CommandHandler<T = any> = (
    context: CommandContext<T>
) => Promise<CommandResult>;

export type CommandPattern = {
    pattern: RegExp;
    name: string;
    description: string;
    usage?: string;
};

export type CommandDefinition<T = any> = {
    pattern?: CommandPattern;
    handler: CommandHandler<T>;
    middleware?: CommandMiddleware[];
    isDefault?: boolean;
    isAutoCommand?: boolean;
    isDevCommand?: boolean;
    queriesToInvalidate?: string[];
};

export type CommandMiddleware = (
    context: CommandContext,
    next: () => Promise<CommandResult>
) => Promise<CommandResult>;

export type CommandRegistry<T = any> = Map<string, CommandDefinition<T>>;

export type CommandError = {
    type: 'VALIDATION' | 'EXECUTION' | 'NOT_FOUND';
    message: string;
    details?: any;
}; 