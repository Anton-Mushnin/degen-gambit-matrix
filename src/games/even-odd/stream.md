# Even-Odd Game Stream

## Contract Events with Display Patterns

### Bet Committed Event
- **Event Name**: `BetCommitted`
- **Display Patterns**:
  - Normal: `{player.slice(0,6)}...{player.slice(-4)} commits bet on {choice} (reveal block {revealBlock})`
  - Free Spin: `{player.slice(0,6)}...{player.slice(-4)} commits FREE SPIN on {choice} (reveal block {revealBlock})`
- **Queries to Refetch**:
  - `['contractBalance']`
  - `['playerBalance', playerAddress]`
  - `['gameStatus', playerAddress]`

### Result Event
- **Event Name**: `BetResult`
- **Display Patterns**:
  - Win: `{player.slice(0,6)}...{player.slice(-4)} wins! Number {number} is {odd/even}. +1400 WEI`
  - Loss: `{player.slice(0,6)}...{player.slice(-4)} loses. Number {number} is {odd/even}. -1000 WEI`
  - Free Spin Win: `{player.slice(0,6)}...{player.slice(-4)} FREE SPIN wins! Number {number} is {odd/even}. +1400 WEI`
  - Free Spin Loss: `{player.slice(0,6)}...{player.slice(-4)} FREE SPIN loses. Number {number} is {odd/even}.`
- **Queries to Refetch**:
  - `['contractBalance']`
  - `['playerBalance', playerAddress]`
  - `['gameStatus', playerAddress]`
  - `['lastResult', playerAddress]`

### Free Spin Event
- **Event Name**: `FreeSpin`
- **Display Pattern**: `{player.slice(0,6)}...{player.slice(-4)} activates free spin on {choice}`
- **Queries to Refetch**:
  - `['gameStatus', playerAddress]`

## Event Types
- `'betCommitted'` - Player commits bet
- `'result'` - Game result revealed
- `'freeSpin'` - Free spin activated

## Stream Display Events
1. Bet commitment on odd/even with reveal block
2. Waiting period (3 blocks)
3. Automatic result revelation with number and win/loss
4. Free spin activation (if won)
5. Free spin commitment and automatic results
6. Return to normal play 