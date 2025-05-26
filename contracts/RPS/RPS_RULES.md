# Rock Paper Scissors Smart Contract Rules

## Overview
This document defines the complete and consistent rules for the Rock Paper Scissors smart contract implementation. These rules govern all aspects of game creation, participation, and resolution.

## 1. Game Setup
### Player 1 (Initiator)
- Must commit a hashed move (move + salt)
- Must deposit a bet amount
- Must set a timeout period
- Can only have one active game at a time
- Game starts in "WAITING_FOR_PLAYER2" state

### Game Parameters
- Minimum bet: TBD
- Timeout period: 24 hours (configurable)
- Platform fee: 5% of pot
- Token: ETH (or specific ERC20)

## 2. Player 2 Participation
### Joining Requirements
- Must match exact bet amount
- Must make a direct move (Rock, Paper, or Scissors)
- Cannot join their own game
- Cannot join timed-out games

### State Changes
- Game transitions to "COMMITTED" state
- Player 2's move is recorded directly
- Funds are locked in contract

## 3. Reveal Phase
### Player 1 Requirements
- Must reveal within timeout period
- Must provide:
  * Original move
  * Salt used for hashing
- Game transitions to "REVEALED" state
- Failed reveal results in Player 1 loss

## 4. Timeout Mechanisms
### Player 2 Timeout
- If Player 2 doesn't join within timeout:
  * Player 1 can withdraw bet
  * Game marked as "CANCELLED"

### Player 1 Timeout
- If Player 1 doesn't reveal within timeout:
  * Player 2 can claim pot
  * Game marked as "PLAYER1_TIMEOUT"

## 5. Winning Conditions
### Move Hierarchy
- Rock beats Scissors
- Scissors beats Paper
- Paper beats Rock
- Same moves result in draw

### Payout Structure
- Winner receives 95% of pot
- Platform fee: 5% of pot
- Draw results in 47.5% to each player

## 6. Fund Management
### Betting Rules
- All bets in same token
- No partial withdrawals
- No bet increases after game start
- Funds locked until game resolution

### Fee Structure
- Fixed 5% platform fee
- Applied to all games
- Collected on game completion

## 7. Game States
```
WAITING_FOR_PLAYER2
├── CANCELLED (timeout)
└── COMMITTED (Player 2 joined)
    ├── PLAYER1_TIMEOUT (reveal timeout)
    └── REVEALED (move revealed)
        └── FINISHED (winner determined)
```

## 8. Security Rules
### Move Commitment
- Moves cannot be modified after commitment
- Hash must match revealed move + salt
- One game per player at a time

### State Management
- All state transitions must be atomic
- No reentrancy during fund transfers
- All inputs must be validated
- All state changes must be verified

## 9. Error Handling
### Invalid States
- Cannot join non-existent games
- Cannot reveal before Player 2 joins
- Cannot withdraw before timeout
- Cannot claim before timeout

### Invalid Actions
- Cannot modify committed moves
- Cannot join game multiple times
- Cannot withdraw partial amounts
- Cannot increase bet after start

## 10. Events
The contract will emit events for:
- Game creation
- Player 2 joining
- Move reveal
- Game completion
- Timeout
- Fund transfers
- Error conditions 