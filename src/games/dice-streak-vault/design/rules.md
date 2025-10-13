# Dice Streak Vault Rules

## Core Gameplay
- Player guesses a number (1-6) and rolls a d6 die
- If guessed correctly - wins 5.95x the bet amount
- If player guesses and rolls the same number consecutively 3+ times - wins 5.95x + streak bonus:
  - 3 in a row: +7% bonus
  - 4 in a row: +18% bonus
  - 5 in a row: +40% bonus
  - 6 in a row: +60% bonus

## Bank Investment System
- Players can deposit funds into the bank to earn shares
- Share calculation: deposit × (1 - investmentFee) ÷ (deposit + currentBank)
- Players can withdraw up to their share × currentBank at any time

## Game Parameters (Constructor)
- Minimum and maximum bet amounts
- Investment fee percentage for bank deposits
- Basic win multiplier (currently 5.95x)
- Streak bonus percentages: 7%, 18%, 40%, 60%

## Random Generation
- Uses commit-reveal randomness for fair play

## Edge Cases
- Maximum streak bonus capped at 6 consecutive wins
- Bank withdrawals limited to player's share
