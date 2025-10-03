# Dice Streak Game Deployments

## XAI Testnet Deployment

**Network:** XAI Testnet v2  
**Chain ID:** 37714555429  
**RPC:** https://testnet-v2.xai-chain.net/rpc  
**Explorer:** https://testnet-explorer-v2.xai-chain.net/  
**Faucet:** https://faucet.quicknode.com/xai  

### Contract Details
- **Contract Name:** DiceStreak
- **Contract Address:** 0xA80a04Ce901fefE86418b2E6452E6a594a4c140C
- **Deployer:** 0x4eD919172bD08D74831f2914aAAe8edA690d08Ab
- **Deployment Block:** Confirmed deployed
- **Deployment Time:** 2025-01-03 (Latest deployment)

### Contract Parameters
- **Bet Amount:** 1 WEI
- **Payout Multiplier:** 5500 (5.5x)

### Contract Functions
- `play(uint8 guess)` - Player guesses 1-6, pays bet amount (commit phase)
- `inspectOutcome(address)` - Player can preview the dice result before accepting
- `previewReveal(bytes)` - Preview random number without consuming commit (view function)
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
- `getCommitDetails(address)` - Returns commit hash and block for player

### Events
- `PlayerWin(address indexed player, uint8 guess, uint8 result, uint256 payout)`
- `PlayerWinWithCombo(address indexed player, uint8 guess, uint8 result, uint256 basePayout, uint256 bonusPayout, string comboType)`

### Streak Combo Bonuses
- 3 streak: 2% of bank
- 4 streak: 5% of bank  
- 5 streak: 15% of bank
- 6 streak: 50% of bank

### Deployment Status
- [x] Contract deployed
- [x] Contract funded
- [x] Basic functionality tested
- [x] Ready for use

---

## DiceStreakDev (Development Version)

### Contract Details
- **Contract Name:** DiceStreakDev
- **Contract Address:** 0x0e9466BB274dB751c1F89523Ecb387e8B165a74f
- **Deployer:** 0x4eD919172bD08D74831f2914aAAe8edA690d08Ab
- **Network:** XAI Testnet v2
- **Chain ID:** 37714555429
- **Deployment Block:** Confirmed deployed
- **Deployment Time:** 2025-01-03 (Latest deployment)

### Contract Parameters
- **Bet Amount:** 1 WEI
- **Payout Multiplier:** 5500 (5.5x)
- **Initial Bank Balance:** 0.000001 ETH

### Additional Dev Features
- `setPredeterminedResult(uint8 result)` - Set predetermined dice result (1-6) or clear with 0
- `getPredeterminedResult(address player)` - Get predetermined result for player
- Predetermined results are automatically cleared after use
- Falls back to normal randomness when no predetermined result is set

### Deployment Status
- [x] Contract deployed
- [x] Contract funded
- [x] Predetermined result functionality tested
- [x] Ready for development testing
