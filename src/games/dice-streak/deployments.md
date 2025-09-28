# Dice Streak Game Deployments

## XAI Testnet Deployment

**Network:** XAI Testnet v2  
**Chain ID:** 37714555429  
**RPC:** https://testnet-v2.xai-chain.net/rpc  
**Explorer:** https://testnet-explorer-v2.xai-chain.net/  
**Faucet:** https://faucet.quicknode.com/xai  

### Contract Details
- **Contract Name:** DiceStreak
- **Contract Address:** 0x2E1C39c9475C62f17493ABaFaFf90eD01640ce51
- **Deployer:** 0x4eD919172bD08D74831f2914aAAe8edA690d08Ab
- **Deployment Block:** [To be filled after deployment]
- **Deployment Time:** [To be filled after deployment]

### Contract Parameters
- **Bet Amount:** 1 WEI
- **Payout Multiplier:** 5500 (5.5x)

### Contract Functions
- `play(uint8 guess)` - Player guesses 1-6, pays bet amount (commit phase)
- `inspectOutcome(address)` - Player can preview the dice result before accepting
- `accept()` - Player accepts the result and processes the game (reveal + process)
- `getBetAmount()` - Returns fixed bet amount
- `getPayoutMultiplier()` - Returns payout multiplier
- `getBankBalance()` - Returns contract balance
- `getBestCombo()` - Returns best streak combo
- `getPlayerStreak(address)` - Returns player's current streak
- `getPlayerTotalWinnings(address)` - Returns player's total winnings
- `getGameStatus(address)` - Returns player's game status
- `getLastBetResult(address)` - Returns player's last bet result
- `getStatistics(uint8)` - Returns statistics for number 1-6
- `hasCommit(address)` - Returns if player has pending commit

### Events
- `PlayerWin(address indexed player, uint8 guess, uint8 result, uint256 payout)`
- `PlayerWinWithCombo(address indexed player, uint8 guess, uint8 result, uint256 basePayout, uint256 bonusPayout, string comboType)`

### Streak Combo Bonuses
- 3 streak: 2% of bank
- 4 streak: 5% of bank  
- 5 streak: 15% of bank
- 6 streak: 50% of bank

### Deployment Status
- [ ] Contract deployed
- [ ] Contract funded
- [ ] Basic functionality tested
- [ ] Ready for use
