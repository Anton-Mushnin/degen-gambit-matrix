# EventConfig Documentation

## Overview

`EventConfig` is a TypeScript interface that defines how to handle blockchain contract events in the Degen Gambit Matrix platform's real-time game stream. It enables automatic processing of on-chain events, cache invalidation, and UI updates through a standardized configuration system.

## Purpose

This type system enables:
- **Event Listening**: Automatic monitoring of specific contract events using wagmi's `watchContractEvent`
- **Cache Management**: Smart invalidation of React Query caches based on event content
- **Stream Processing**: Transformation of raw blockchain logs into user-friendly stream events
- **Real-time Updates**: Live feed of game activity for all players to see

## Type Structure

```typescript
export interface EventConfig {
  eventName: string;
  processLogs: (logs: any[], activeAccount: string | undefined) => StreamEvent[];
  invalidateQueries: (logs: any[], activeAccount: string | undefined) => string[][];
}
```

## Property Details

### eventName (required)
The name of the contract event to listen for, as defined in the contract ABI.

**Type**: `string`

**Example**: `'PlayerWin'`, `'Transfer'`, `'BetPlaced'`

### processLogs (required)
Function that transforms raw blockchain event logs into `StreamEvent` objects for display in the game stream.

**Type**: `(logs: any[], activeAccount: string | undefined) => StreamEvent[]`

**Parameters**:
- `logs`: Array of event logs from the blockchain (contains `args`, `blockNumber`, `transactionHash`, `logIndex`, etc.)
- `activeAccount`: The currently connected wallet address, or `undefined` if no wallet is connected

**Returns**: Array of `StreamEvent` objects to display in the stream

**Example**:
```typescript
processLogs: (logs: any[]) => {
  const events: StreamEvent[] = [];

  logs.forEach((log: any) => {
    const { player, amount, result } = log.args;
    const description = `${player.slice(0, 6)}... wins ${formatEther(amount)} ETH!`;

    events.push({
      player,
      description,
      blockNumber: Number(log.blockNumber),
      eventType: 'win',
      transactionHash: log.transactionHash,
      logIndex: log.logIndex
    });
  });

  return events;
}
```

### invalidateQueries (required)
Function that determines which React Query caches should be invalidated when events are received.

**Type**: `(logs: any[], activeAccount: string | undefined) => string[][]`

**Parameters**:
- `logs`: Array of event logs from the blockchain
- `activeAccount`: The currently connected wallet address

**Returns**: Array of query key arrays to invalidate

**Example**:
```typescript
invalidateQueries: (logs: any[], activeAccount: string | undefined) => {
  const queries: string[][] = [['bankBalance']]; // Always invalidate bank balance

  // If current user is involved, invalidate their personal data too
  if (logs.some((log: any) => log.args.player === activeAccount)) {
    queries.push(['playerBalance'], ['playerTotalWinnings']);
  }

  return queries;
}
```

## StreamEvent Type

`StreamEvent` is the data structure used to represent individual events in the game stream feed. It contains all the information needed to display and identify events in the UI.

### Type Structure

```typescript
export interface StreamEvent {
  player: string;
  blockNumber: number;
  eventType: string;
  description: string;
  transactionHash: string;
  logIndex: number;
  [key: string]: any; // Allow additional properties
}
```

### Property Details

#### player (required)
The wallet address of the player who triggered the event.

**Type**: `string`

**Example**: `'0x742d35Cc6634C0532925a3b844Bc454e4438f44e'`

#### blockNumber (required)
The blockchain block number where the event occurred. Used for chronological ordering and deduplication.

**Type**: `number`

**Example**: `12345678`

#### eventType (required)
A string identifier categorizing the type of event. Used for styling, filtering, and conditional logic.

**Type**: `string`

**Common values**: `'win'`, `'combo_win'`, `'bet'`, `'loss'`, `'jackpot'`

#### description (required)
Human-readable description of the event for display in the stream UI. Should be concise but informative.

**Type**: `string`

**Example**: `'0x742d...f44e wins! Guess: 3, Result: 3, Payout: 1.5 ETH'`

#### transactionHash (required)
The hash of the transaction that emitted this event. Used for deduplication and linking to blockchain explorers.

**Type**: `string`

**Example**: `'0x8ba1f109551bd432803012645261ad5d634a3004e6c3f1e6b8c1f6f6f6f6f6f6f6'`

#### logIndex (required)
The index of this event within the transaction's event logs. Combined with `transactionHash` for unique event identification.

**Type**: `number`

**Example**: `0`, `1`, `2`

#### [key: string]: any (optional)
Index signature allowing additional custom properties specific to certain event types or games.

**Example**: `{ bonusAmount: '500000000000000000', comboType: 'triple' }`

### Usage in processLogs

The `processLogs` function transforms raw blockchain logs into `StreamEvent` objects:

```typescript
processLogs: (logs: any[]) => {
  return logs.map((log: any) => {
    const { player, amount } = log.args;

    return {
      player,
      blockNumber: Number(log.blockNumber),
      eventType: 'win',
      description: `${player.slice(0, 6)}... wins ${formatEther(amount)} ETH!`,
      transactionHash: log.transactionHash,
      logIndex: log.logIndex,
      // Optional additional data
      amount: amount.toString()
    };
  });
}
```

### Event Deduplication

The GameStream component automatically prevents duplicate events using `transactionHash` and `logIndex`:

```typescript
const isEventDuplicate = (newEvent: StreamEvent, existingEvents: StreamEvent[]) => {
  return existingEvents.some(
    event =>
      event.transactionHash === newEvent.transactionHash &&
      event.logIndex === newEvent.logIndex
  );
};
```

## Related Types

- `StreamEvent`: The output type returned by `processLogs`
- `GameStreamProps`: Component props that accept `eventConfigs` array

