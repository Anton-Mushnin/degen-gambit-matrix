# Dice Run Progress

## Step 1 - Initialization
- Created game folder: src/games/dice-run
- Created progress file

## Step 2 - Rules
- Created design folder
- Created rules.md with complete game mechanics

## Step 2.1 - Randomness
- Selected CommitRevealRandomness
- Secure random using future block hashes
- Good security for bank investment mechanics

## Step 3 - Commands
- Created commands.md with 4 terminal commands
- Payable: play <prediction>, invest <amount>
- Non-payable: accept, withdraw <amount>
- Uses CommitRevealRandomness pattern (play commits, accept reveals)

