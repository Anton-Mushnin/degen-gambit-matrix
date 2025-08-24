# Even-Odd Game Info Display

## Data Structure Pattern
Following `DataItem[]` structure from degen-gambit ContractInfo.tsx:

### Contract Data
```typescript
const contractData: DataItem[] = [
    {
        type: 'query',
        label: 'Pot: ',
        queryKey: ['contractBalance', contractAddress],
        queryFn: () => getBalance(wagmiConfig, {address: contractAddress})
    },
    {
        type: 'static',
        label: 'Bet Amount: ',
        data: {
            formatted: '1000 WEI',
            value: BigInt(1000),
            decimals: 0
        }
    },
    {
        type: 'static',
        label: 'Win Payout: ',
        data: {
            formatted: '1400 WEI',
            value: BigInt(1400),
            decimals: 0
        }
    },
    {
        type: 'query',
        label: 'Current Block: ',
        queryKey: ['currentBlock'],
        queryFn: () => getCurrentBlock(),
        refetchInterval: 5000,
        animation: false
    }
];
```

### Player Data
```typescript
const playerData: DataItem[] = playerAddress ? [
    {
        type: 'static',
        label: 'Player: ',
        data: {
            formatted: displayName ?? '',
            value: BigInt(0),
            decimals: 0
        },
        animation: false
    },
    {
        type: 'query',
        label: 'Balance: ',
        queryKey: ['playerBalance', playerAddress],
        queryFn: () => getBalance(wagmiConfig, {address: playerAddress})
    },
    {
        type: 'query',
        label: 'Game Status: ',
        queryKey: ['gameStatus', playerAddress],
        queryFn: () => getGameStatus(playerAddress),
        animation: false
    },
    {
        type: 'query',
        label: 'Last Result: ',
        queryKey: ['lastResult', playerAddress],
        queryFn: () => getLastResult(playerAddress),
        animation: false
    }
] : [];
```

## Display Items
- **Pot**: Contract balance showing total winnings pool
- **Bet Amount**: Fixed 1000 WEI bet (static)
- **Win Payout**: Fixed 1400 WEI payout (static)  
- **Current Block**: Live blockchain block number
- **Player**: Player display name
- **Balance**: Player's ETH balance
- **Game Status**: "Normal" or "Free Spin Active"
- **Last Result**: Last number and win/loss result 