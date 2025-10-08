# Dice Run Progress

## Step 1 - Initialization
- Created game folder: src/games/dice-run
- Created progress file

## Step 2 - Rules
- Created design folder
- Created rules.md with complete game mechanics

## Step 3 - Commands
- Created commands.md with player commands: play, fund, withdraw

## Step 4 - Info
- Created info.md with comprehensive game information including:
  - Game parameters (bet amount, payout calculation, streak shares, investment fee)
  - Bank info (balance, best streak)
  - Player bank share data (investment, percentage, change)
  - Player stats (balance, winnings, current streak)
  - Current combo possibility (next needed number, potential bonus)
  - Dice statistics table (occurrences, bets, wins per number)

## Step 5 - Stream
- Created stream.md with event definitions for:
  - Gameplay events (bet placement, basic wins, streak bonus wins)
  - Bank events (investments)
  - Record events (best streak broken)

## Step 6 - Randomness
- Game uses randomness for dice rolls (1-6)
- User selected CommitRevealRandomness for secure random numbers with waiting period
- Security benefits: No miner influence, future block randomness prevents stuck states
- Trade-off: Players must wait for randomness to be revealed

## Step 7 - Info.ts
- Created info.ts in info/ folder implementing all data items from info.md
- Implemented both contract data and player data sections
- Used table format for streak bank share percentages and dice statistics
- Set animation: false for non-monetary values, animation enabled for currency amounts
- Imported read functions from contractFunctions/read.ts

## Step 8 - Commands.ts
- Created commands.ts with three command definitions: play, fund, withdraw
- Each command includes pattern matching, descriptions, usage examples
- Configured query invalidation for all affected data items from info.ts
- Follows established command module pattern

## Step 9 - Stream.ts
- Created stream.ts implementing event processing for 5 events
- Configured query invalidation for each event type
- Implemented event formatting with player addresses and formatted ETH amounts
- Added appropriate event types (bet, win, streak_win, investment, record)

## Step 10 - Contract Read Functions
- Created DiceRun.abi.ts with TypeScript ABI definitions
- Created read.ts with all contract read functions
- All functions use one contract call each
- Formatting uses formatEtherOrWei with 10,000,000 WEI threshold
- Functions comply exactly with info.md requirements
- Optimized share change calculation: added getPlayerShareChange to contract ABI for single-call efficiency

## Step 11 - Command Handlers (Redone)
- Recreated diceRun.handlers.ts with proper commit-reveal-accept pattern implementation
- Updated handlePlay to use commitRevealAccept utility for commit-reveal-accept flow
- Updated decodePlayResult in helpers.ts to work with inspectOutcome format (prizeValue, additionalData)
- Modified decodePlayResult to decode diceResult and streakLength from additionalData bytes
- Kept handleFund and handleWithdraw using direct contract calls
- Updated handleAccept to properly return accept function results
- Added missing inspectOutcome and accept functions to DiceRun.abi.ts for commit-reveal-accept pattern
- All handlers can have errors as specified
- All contract functions used in code are now present in the ABI

## Step 12 - Stream Events
- Updated stream.md to include bet reveal event for commit-reveal pattern
- Current DiceRun.abi.ts has 5 events (will need BetRevealed event added when contract is created):
  - BetPlaced: player, numberChosen, betAmount
  - PlayerWin: player, diceRolled, payoutAmount
  - PlayerWinWithStreak: player, streakLength, bonusAmount
  - Investment: player, investmentAmount, newSharePercentage
  - NewBestStreak: player, newStreakLength
- Stream.ts will need BetRevealed event configuration added after contract creation

## Step 13 - Contract Creation
- ✅ Contract inherits from CommitRevealRandomness (selected in step 6)
- ✅ Implements accept() function for revealing committed bet results
- ✅ All getters affected by pending commits check playerCommits mapping
- ✅ Follows DiceStreak.sol pattern for commit-reveal implementation
- ✅ Contract compiles successfully with no errors
- ✅ All ABI functions implemented and comply with rules.md
- ✅ Fixed bet amounts, streak system, bank investments with fees all implemented
- ✅ Fixed immutable array issue by using individual immutable variables
- ✅ Fixed variable shadowing in inspectOutcome function
- ✅ Removed incorrect override keyword from accept function