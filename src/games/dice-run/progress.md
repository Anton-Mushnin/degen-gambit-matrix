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

## Step 11 - Command Handlers
- Created diceRun.helpers.ts with input parsing and result formatting functions
- Created write.ts with play, fund, withdraw, and accept contract functions
- Updated DiceRun.abi.ts to include write function signatures (play, fund, withdraw, accept)
- Created handlers.ts with handlePlay, handleFund, handleWithdraw, and handleAccept functions
- Dice-run uses commit-reveal-accept pattern due to CommitRevealRandomness selection
- Added 'accept' command to commands.ts for revealing bet results
- All handlers can have errors as specified

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
- Contract will inherit from CommitRevealRandomness (selected in step 6)
- Will implement accept() function for revealing committed bet results
- Will emit BetRevealed event when results are accepted
- Must check pending commits in all getters that are affected by commits
- Follow DiceStreak.sol pattern for commit-reveal implementation

## Step 14 - Deployment and Configuration
- Created deploy-dice-run.cjs script with contract parameters:
  - betAmount: 100 WEI
  - basicPayoutMultiplier: 57500 (5.75x)
  - streakBankShare3: 300 (3%)
  - streakBankShare4: 700 (7%)
  - streakBankShare5: 1500 (15%)
  - streakBankShare6: 3000 (30%)
  - investmentFeePercent: 100 (1%)
- Successfully deployed to XAI testnet at address: 0x6F69eDa03a207bfbBb14bAB1569034C7a2Cb3eC7
- Created gameConfig.ts with production/dev configurations and network details

## Step 15 - Components
- Copied dice-streak components to dice-run/components/
- Components include: DiceNumbers, DiceStreakProcessingComponent, DiceStreakOutcomeComponent
- All components are presented and ready for use

## Step 16 - Game Module Integration
- Created index.tsx following dice-streak pattern
- Imported all necessary modules: commands, components, info, stream, config
- Added privateKeyAddress export to info.ts
- Fixed build errors in write.ts (removed unused imports, fixed type issues)
- Added dice-run to register.ts and set as default game
- Build completed successfully
- Application running in development mode