# CommandDefinition<TerminalCommandParams>[] Documentation

## Overview

`CommandDefinition<TerminalCommandParams>[]` is a TypeScript array type used to define and register terminal commands for blockchain games in the Degen Gambit Matrix platform. It serves as the central configuration system for handling user input, executing blockchain transactions, and managing UI state updates.

## Purpose

This type system enables:
- **Command Pattern Matching**: Regex-based command recognition and parameter extraction
- **Handler Execution**: Standardized execution flow with blockchain interaction
- **Cache Management**: Automatic invalidation of React Query caches after state changes
- **Dev Mode Support**: Conditional command availability based on development environment
- **Auto-Play Loops**: Commands that can auto-repeat when auto mode is enabled

## Type Structure

```typescript
export type CommandDefinition<T = any> = {
    pattern?: CommandPattern;           // Command matching and metadata
    handler: CommandHandler<T>;         // Execution logic
    middleware?: CommandMiddleware[];   // Optional processing pipeline
    isDefault?: boolean;               // Fallback command for unmatched input
    isAutoCommand?: boolean;           // Auto-triggers after execution
    isDevCommand?: boolean;            // Dev mode only
    queriesToInvalidate?: string[];    // Cache keys to refresh
};
```

## Property Details

### pattern (optional)
Defines how to match and describe the command:

```typescript
type CommandPattern = {
    pattern: RegExp;      // Regex for input matching and parameter extraction
    name: string;         // Command identifier
    description: string;  // Brief description for help text
    usage?: string;       // Usage example for help text
};
```

### handler (required)
The main execution function that processes the command:

```typescript
type CommandHandler<T = any> = (
    context: CommandContext<T>
) => Promise<CommandResult>;
```

Receives:
- `input`: Raw user input string
- `params`: TerminalCommandParams with blockchain context

Returns:
- `output`: Array of strings for immediate terminal display (general command feedback)
- `outcome`: Array of strings for special outcome messages (win/lose notifications)
- `isPrize`: Boolean indicating if result is a prize/win (triggers win effects)
- `autoCommand`: String for next auto-executed command (when auto mode is enabled)
- `queriesToInvalidate`: Cache keys to refresh (can override command-level setting)

### isDefault (optional)
When `true`, this command acts as a fallback handler for unmatched input. Typically shows help text with available commands.

### isAutoCommand (optional)
When `true`, this command can be auto-repeated when auto mode is enabled. Auto mode is toggled by the special "auto" command, and when active, commands with `isAutoCommand: true` will automatically re-execute themselves after completion, creating an auto-play loop. This is typically used for repetitive betting commands like dice rolls or spins.

### isDevCommand (optional)
When `true`, command is only available in development mode. Filtered out in production builds.

### queriesToInvalidate (optional)
Array of React Query cache keys to invalidate after successful command execution. Ensures UI updates reflect blockchain state changes.

## TerminalCommandParams

Commands receive standardized blockchain context:

```typescript
type TerminalCommandParams = {
    activeAccount: Account | undefined;    // User's connected wallet
    client: ThirdwebClient;               // Thirdweb client instance
    publicClient: PublicClient | null;    // Viem public client for reads
    contractAddress: string;              // Target contract address
    contractABI?: any;                    // Contract ABI (varies by dev mode)
};
```


## Cache Invalidation Strategy

Commands specify which React Query caches to invalidate after execution:

```typescript
queriesToInvalidate: [
    'playerBalance',      // User's ETH balance
    'playerCurrentStreak', // Current win streak
    'playerTotalWinnings', // Lifetime winnings
    'bankBalance',        // Contract bank balance
    'nextNeededDiceNumber', // Combo continuation hint
    'potentialBonusAmount' // Potential prize amount
]
```

