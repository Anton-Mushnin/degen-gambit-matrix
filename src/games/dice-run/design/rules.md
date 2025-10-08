# Dice Run Rules

## Basic Game
- Bet amount is fixed (constructor parameter)
- Player selects number (1-6) and commits bet
- Contract generates random number (1-6)
- If prediction matches:
  - Player wins: (basicPayoutMultiplier * bet)
  - basicPayoutMultiplier 
- If prediction fails: player loses bet, streak resets

## Streak System
- Winning consecutively on same or sequential numbers creates streak
- Same numbers: 3→3→3
- Sequential ascending: 1→2→3
- Sequential descending: 6→5→4
- Streak of 3+ wins: player gets bank bonus
- Bank bonus = streakBankShare[streakLength] * currentBank
- streakBankShare for lengths 3,4,5,6 are constructor parameters
- Any loss resets the streak to 0

## Bank Investment
- Any player can invest any amount into bank at any time
- Investment fee is charged: fee = investment * investmentFeePercent
- Net investment = investment - fee (fee stays in contract as profit)
- Investor receives ownership share = netInvestment / totalBankShares
- Can withdraw at any time: (playerShares / totalShares) * currentBank
- Bank grows from basic win contributions
- Bank shrinks from streak bonus payouts and investor withdrawals

## Constructor Parameters
- betAmount: fixed bet for all players
- basicPayoutMultiplier: multiplier for basic win
- bankContribution: amount taken from basic win payout to bank
- streakBankShare[3,4,5,6]: percentage of bank for each streak length
- investmentFeePercent: percentage fee charged on bank investments

## Initial State
- Bank starts at 0
- No minimum required, funded by investors

