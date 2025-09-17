# Dice Streak Game Implementation Progress

## Step 1: Folder Structure ✅
- Created folder structure in src/games/dice-streak
- Added to registry as default game in src/games/register.ts

## Step 2: Rules ✅
- Created rules.md with game mechanics
- Payout: 5.5x for correct guess
- Streak bonuses: 2%, 5%, 15%, 50% of bank
- Fixed bet: 1 WEI
- Bank value: TBD before deployment

## Step 2.1: Randomness ✅
- Chosen CommitRevealRandomness for secure randomness

## Step 3: Commands ✅
- Created commands.md with play(uint8 guess) command
- Player pays 1 WEI to guess number 1-6
- All statuses displayed automatically without commands

## Step 4: Info ✅
- Created design/info.md with data display list
- Contract constants: address, fixed bet amount (n WEI), payout (m WEI)
- Contract status: bank balance, best combo player, statistics table
- Player status: address/ENS, balance, current streak, combo possibility, total winnings
- Current game status: rolling/waiting/claiming, last bet win/loss

## Step 5: Stream ✅
- Created design/stream.md with win events
- Player wins with base payout (shows guess, result, payout amount)
- Player wins with streak combo bonus (shows guess, result, base payout + bonus amount, combo type)

