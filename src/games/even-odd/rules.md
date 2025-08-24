# Even-Odd Game Rules

## How to Play
1. **Commit**: Player bets 1000 WEI and commits guess (odd/even)
2. **Wait**: System waits 3 blocks for secure randomness
3. **Auto-reveal**: System automatically reveals result using future block hash
4. If guess is correct: player wins 1400 WEI + gets free spin with same guess
5. If guess is wrong: player loses 1000 WEI, returns to normal play

## Payouts
- **Win**: 1400 WEI (1.4x payout)
- **Free Spin Bonus**: Winner gets another spin with same guess
- **Multiple Free Spins**: Can chain consecutive wins indefinitely

## Random Generation
- **Future block hash** randomness for security
- Uses commit-reveal pattern to prevent manipulation
- 3-block delay ensures unpredictable randomness
- 50% chance for odd/even

## Commands
- `odd` - Commit bet that number will be odd
- `even` - Commit bet that number will be even 