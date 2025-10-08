# Dice Run Progress

## Step 1 - Initialization
- Created game folder: src/games/dice-run
- Created progress file

## Step 2 - Rules
- Created design folder
- Created rules.md with complete game mechanics

## Step 3 - Commands
- Created commands.md with player commands: play, fund, withdraw

## Step 10 - Contract Read Functions
- Created DiceRun.abi.ts with TypeScript ABI definitions
- Created read.ts with all contract read functions
- All functions use one contract call each
- Formatting uses formatEtherOrWei with 10,000,000 WEI threshold
- Functions comply exactly with info.md requirements
- Updated for payout rule changes: removed bankContribution from payout calculation
- Removed unused getBankContribution from ABI
- Optimized share change calculation: added getPlayerShareChange to contract ABI for single-call efficiency

## Step 11 - Command Handlers
- Created diceRun.helpers.ts with input parsing and result formatting functions
- Created write.ts with play, fund, and withdraw contract functions
- Updated DiceRun.abi.ts to include write function signatures (play, fund, withdraw)
- Created handlers.ts with handlePlay, handleFund, handleWithdraw functions
- Dice-run uses direct contract calls (no commit-reveal-accept pattern)
- All handlers can have errors as specified


