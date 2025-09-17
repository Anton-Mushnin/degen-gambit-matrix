# Dice Streak Commands

## Player Commands (Payable)
- `play(uint8 guess)` - Player guesses a number 1-6, pays 1 WEI bet, triggers dice roll and streak logic

## Contract Commands (Non-payable)
- None needed (all statuses displayed automatically)

## Command Details

### play(uint8 guess)
- **Parameters**: guess (1-6)
- **Payment**: 1 WEI
- **Actions**:
  - Roll dice using CommitRevealRandomness
  - Check win/loss condition
  - Update streak if correct guess
  - Pay out winnings + streak bonus if applicable
  - Reset streak if wrong guess
