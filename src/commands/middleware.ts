import { CommandMiddleware, CommandError } from './types';

export const loggingMiddleware: CommandMiddleware = async (context, next) => {
    console.log(`Executing command: ${context.input}`);
    const startTime = Date.now();
    
    try {
        const result = await next();
        const duration = Date.now() - startTime;
        console.log(`Command completed in ${duration}ms`);
        return result;
    } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`Command failed after ${duration}ms:`, error);
        throw error;
    }
};

export const validationMiddleware = (validator: (input: string) => boolean): CommandMiddleware => 
    async (context, next) => {
        if (!validator(context.input)) {
            throw {
                type: 'VALIDATION',
                message: 'Invalid command format',
                details: { input: context.input }
            };
        }
        return next();
    };

export const errorHandlingMiddleware: CommandMiddleware = async (_, next) => {
    try {
        return await next();
    } catch (error: unknown) {
        const commandError = error as CommandError;
        if (commandError.type === 'VALIDATION') {
            return {
                output: [`Validation error: ${commandError.message}`]
            };
        }
        if (commandError.type === 'EXECUTION') {
            return {
                output: [`Execution error: ${commandError.message}`]
            };
        }
        // For unknown errors, rethrow
        throw error;
    }
}; 