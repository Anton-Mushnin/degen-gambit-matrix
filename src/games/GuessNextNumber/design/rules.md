# GuessNextNumber - Rules

## Gameplay
- Player guesses number 1-6
- Fixed bet amount (contract parameter)
- Correct guess: 5.8× bet payout

## Streaks
- Consecutive correct guesses build streak (max 6)
- Streak bonuses from bank:
  - 3 streak: 1%
  - 4 streak: 5%
  - 5 streak: 15%
  - 6 streak: 50%
- After streak 6 or wrong guess: streak resets to 0

## Bank
- Minimum bank balance: 11× bet to allow play
- Deposit fee: 1% (goes to bank)
- Player share: (deposit - fee) / (currentBank + deposit)
- First depositor gets 100%
- Withdrawal: free, proportional to share

## Randomness
- Commit-reveal pattern for secure number generation

