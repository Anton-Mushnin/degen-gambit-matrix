# Dice Run Commands

## Player Commands (Payable)
- `play <prediction>` - Player predicts a number 1-6, commits bet (fixed bet amount)
- `invest <amount>` - Player invests any amount into the bank

## Player Commands (Non-payable)
- `accept` - Reveals the dice roll result and processes win/loss
- `withdraw <amount>` - Investor withdraws their share from the bank

## Command Details

### play <prediction>
- **Parameters**: prediction (1-6)
- **Payment**: betAmount (fixed, from constructor)
- **Actions**:
  - Commit bet with prediction using CommitRevealRandomness
  - Store prediction for later reveal
  - Auto-resolve any pending previous bet before starting new one
- **Updated Info Items**:
  - Contract Status: none
  - Player Status: Balance (bet deducted)
  - Current Game Status: Game state (waiting for reveal), Last prediction

### accept
- **Parameters**: None
- **Payment**: None
- **Actions**:
  - Generate random number (1-6) using CommitRevealRandomness
  - Check if prediction matches result
  - If match:
    - Pay player: (basicPayoutMultiplier * betAmount) - bankContribution
    - Add bankContribution to bank
    - Update streak (check if same number or sequential)
    - If streak >= 3: pay bank bonus (streakBankShare[streakLength] * currentBank)
  - If no match:
    - Player loses bet
    - Reset streak to 0
- **Updated Info Items**:
  - Contract Status: Bank balance
  - Player Status: Balance, Current streak (history of last wins), Total winnings
  - Current Game Status: Dice result, Win/loss result, Payout amount, Bank bonus if applicable

### invest <amount>
- **Parameters**: amount (any amount in WEI)
- **Payment**: amount
- **Actions**:
  - Charge investment fee: fee = amount * investmentFeePercent
  - Calculate net investment: netInvestment = amount - fee
  - Add netInvestment to player's bank shares
  - Update totalBankShares += netInvestment
  - Add netInvestment to bank balance
- **Updated Info Items**:
  - Contract Status: Bank balance, Total bank shares
  - Player Status: Balance, Bank shares owned, Ownership percentage

### withdraw <amount>
- **Parameters**: amount (requested withdrawal amount in WEI)
- **Payment**: None
- **Actions**:
  - Calculate player's max withdrawal: (playerShares / totalBankShares) * currentBank
  - Verify amount <= max withdrawal
  - Calculate shares to burn: sharesToBurn = (amount * totalBankShares) / currentBank
  - Reduce playerShares by sharesToBurn
  - Reduce totalBankShares by sharesToBurn
  - Transfer amount to player
  - Reduce bank by amount
- **Updated Info Items**:
  - Contract Status: Bank balance, Total bank shares
  - Player Status: Balance, Bank shares owned, Ownership percentage
