# Dice Streak Commands

## Player Commands (Payable)
- `play(uint8 guess)` - Player guesses a number 1-6, pays 1 WEI bet, triggers dice roll and streak logic

## Contract Commands (Non-payable)
- None needed (all statuses displayed automatically)

## Development Commands (Dev Mode Only)
- `setDice<number>(uint8 number)` - Development command to manually set dice outcome
- `unsetDice()` - Development command to clear predetermined dice outcome and return to random results

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
- **Updated Info Items**:
  - Contract Status: Bank balance, Best combo, Table statistics (occurrences, % of bets, win/loss ratio)
  - Player Status: Balance, Current streak, Combo possibility (required number, payout), Total winnings
  - Current Game Status: Game state (rolling/waiting/claiming), Last bet, Win/loss result

### setDice<number>(uint8 number)
- **Parameters**: number (1-6)
- **Actions**:
  - Manually set dice outcome to specified number
- **Dev Mode Only**: This command is only available when the contract is in development mode
- **Updated Info Items**:
  - None

### unsetDice()
- **Parameters**: None
- **Actions**:
  - Clear predetermined dice outcome
  - Return to normal random dice results
- **Dev Mode Only**: This command is only available when the contract is in development mode
- **Updated Info Items**:
  - None