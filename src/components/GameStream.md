# GameStream Component

A generic, reusable component for displaying contract events in real-time across different games.

## Features

- **Generic**: Works with any smart contract and ABI
- **Configurable**: Event processing logic is defined through configuration
- **Query Invalidation**: Automatic query invalidation based on events
- **Duplicate Prevention**: Prevents duplicate events from being displayed
- **Auto-scroll**: Automatically scrolls to bottom when new events arrive
- **Styling**: Accepts custom CSS classes for styling

## Usage

### 1. Create Event Configuration

Define your event processing logic in a configuration file:

```typescript
import { EventConfig } from '../../../components/GameStream';

export const myGameStreamConfig: EventConfig[] = [
  {
    eventName: 'MyEvent',
    invalidateQueries: (logs, activeAccount) => {
      // Return array of query keys to invalidate
      return [['contractBalance'], ['playerBalance', activeAccount]];
    },
    processLogs: (logs, contractInfo, activeAccount) => {
      // Return array of StreamEvent objects
      return logs.map(log => ({
        player: log.args.player,
        description: `${log.args.player} did something`,
        blockNumber: Number(log.blockNumber),
        eventType: 'myEvent',
        transactionHash: log.transactionHash,
        logIndex: log.logIndex
      }));
    }
  }
];
```

### 2. Use in Your Game Component

```typescript
import GameStream from '../../../components/GameStream';
import { myGameStreamConfig } from './config/streamConfig';

const MyGameStream: React.FC = () => {
  const contractInfo = useMyGameInfo(contractAddress);

  return (
    <GameStream
      contractAddress={contractAddress}
      abi={myGameABI}
      eventConfigs={myGameStreamConfig}
      contractInfo={contractInfo.data}
      className={styles.container}
    />
  );
};
```

## Interface Definitions

### StreamEvent
```typescript
interface StreamEvent {
  player: string;
  blockNumber: number;
  eventType: string;
  description: string;
  transactionHash: string;
  logIndex: number;
  [key: string]: any; // Allow additional properties
}
```

### EventConfig
```typescript
interface EventConfig {
  eventName: string;
  processLogs: (logs: any[], contractInfo: any, activeAccount: string | undefined) => StreamEvent[];
  invalidateQueries: (logs: any[], activeAccount: string | undefined) => string[][];
}
```

### GameStreamProps
```typescript
interface GameStreamProps {
  contractAddress: string;
  abi: any;
  eventConfigs: EventConfig[];
  contractInfo: any;
  className?: string;
}
```

## Examples

See the following examples for complete implementations:
- `src/games/degen-gambit/config/streamConfig.ts` - Degen Gambit game events
- `src/games/even-odd/config/streamConfig.ts` - Even Odd game events

## Benefits

1. **Reusability**: Same component works for all games
2. **Maintainability**: Event logic is centralized in configuration
3. **Consistency**: All games use the same event handling patterns
4. **Flexibility**: Easy to add new events or modify existing ones
5. **Type Safety**: Full TypeScript support with proper interfaces 