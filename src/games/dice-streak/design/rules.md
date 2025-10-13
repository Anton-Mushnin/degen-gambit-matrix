# Dice Streak Game Rules

## Game Mechanics
- Player guesses a number g ∈ [1..6]
- Dice rolls result r ∈ [1..6]

## Win Condition
- If r == g: Player wins and gets payout
- If r ≠ g: Player loses and streak resets

## Payout System
- Base payout: 5.5 × bet amount (when r == g)
- Streak bonus: bank × share[L] (when streak combo detected)
- share[3] = 0.02 (2% от bank)
- share[4] = 0.05 (5% от bank)
- share[5] = 0.15 (15% от bank)
- share[6] = 0.50 (50% от bank)

## Streak System
- Each correct guess adds r to player's faces array
- Streak combos trigger when last L ≥ 3 numbers form:
  - All equal (e.g., 3,3,3)
  - Increasing sequence (e.g., 1,2,3)
  - Decreasing sequence (e.g., 6,5,4)
- Streak resets to empty array on wrong guess

## Betting
- Fixed bet amount: amount will be passed in the contract constructor

