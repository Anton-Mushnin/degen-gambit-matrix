export type CommandResult<T = any> = {
    output: string[];
    outcome?: bigint[];
    isPrize?: boolean;
    data?: T;
};

export type CommandContext<T = any> = {
    input: string;
    params: T;
};

export type CommandHandler<T = any, R = any> = (
    context: CommandContext<T>
) => Promise<CommandResult<R>>;

export type CommandPattern = {
    pattern: RegExp;
    name: string;
    description: string;
    usage?: string;
};

export type CommandDefinition<T = any, R = any> = {
    pattern?: CommandPattern;
    handler: CommandHandler<T, R>;
    middleware?: CommandMiddleware[];
    isDefault?: boolean;
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