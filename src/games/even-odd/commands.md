# Even-Odd Game Commands and Actions

## Commands (User Input)

### odd
- **Input Pattern**: `/^odd$/`
- **Usage**: `odd`
- **Waiting Pattern**: "Committing bet on odd..."
- **Output Pattern**: 
  - Success: "Bet committed: ODD ([amount] WEI). Auto-reveal in 3 blocks."
  - Already Pending: "You have a pending bet. Wait for auto-reveal."

### even
- **Input Pattern**: `/^even$/`
- **Usage**: `even`
- **Waiting Pattern**: "Committing bet on even..."
- **Output Pattern**: 
  - Success: "Bet committed: EVEN ([amount] WEI). Auto-reveal in 3 blocks."
  - Already Pending: "You have a pending bet. Wait for auto-reveal."



### help
- **Input Pattern**: Default handler for unrecognized commands
- **Output Pattern**: 
  - "Available commands:"
  - "• odd - Commit bet that number will be odd"
  - "• even - Commit bet that number will be even"
  - "Current bet: 1000 WEI | Win payout: 1400 WEI | Auto-reveal: 3 blocks"

## Actions (Programmatic)

### auto-reveal
- **Trigger**: Called automatically after 3 blocks from bet commit
- **Delay**: 3 blocks
- **Output Pattern**: 
  - Win: "Number is [X] ([odd/even]). You win [payout] WEI! → [action:free-spin]"
  - Loss: "Number is [X] ([odd/even]). You lose [amount] WEI."

### free-spin
- **Trigger**: Called by auto-reveal win
- **Delay**: None
- **Waiting Pattern**: "FREE SPIN: Committing bet on [choice]..."
- **Output Pattern**: 
  - Success: "FREE SPIN bet committed: [CHOICE] (0 WEI). Auto-reveal in 3 blocks."

### timeout-forfeit
- **Trigger**: Called when reveal window expires (256+ blocks)
- **Delay**: None  
- **Output Pattern**: "⌛ Reveal window expired. Your bet has been forfeited." 