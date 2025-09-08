# Even-Odd Game Deployments

## Xai Testnet v2
- **Network**: Xai Testnet v2
- **Chain ID**: 37714555429
- **RPC**: https://testnet-v2.xai-chain.net/rpc
- **Explorer**: https://sepolia.xaiscan.io/
- **Faucet**: https://faucet.quicknode.com/xai

### ✅ Deployment Details - LATEST VERSION (WITH CUMULATIVE WINNINGS)
- **Contract Address**: `0xEf506F17e839fc646Ff61605E640e4C78D38ffCF`
- **Deployer**: `0x4eD919172bD08D74831f2914aAAe8edA690d08Ab`
- **Status**: Successfully deployed (Latest version with cumulative winnings tracking)
- **Deployment Date**: January 16, 2025
- **Block Number**: Latest
- **Funding**: 0.000001 ETH for payouts

### Previous Deployments
- **Contract Address**: `0x39488288a28886B6145bf0B736c5C8F9AB08cC47` (Previous version)
- **Status**: Deprecated (replaced by latest version)
- **Contract Address**: `0x5C1B3d2d3c3861bBe0f6f482Ac6fF8AabF3A2168` (Previous version)
- **Status**: Deprecated (replaced by latest version)

### Contract Constants
- **Bet Amount**: 1000 WEI
- **Win Payout**: 1400 WEI (1.4x multiplier)
- **Reveal Window**: 256 blocks (when block hashes become unreachable)
- **Randomness Method**: CommitRevealRandomness with block hash entropy

### New Features (Latest Version)
- **Cumulative Winnings Tracking**: Each player's total winnings are now tracked
- **Total Winnings Mapping**: `totalWinnings[address]` public mapping
- **Automatic Accumulation**: Winnings are automatically added to player's total on each win

### Deployment Command
```bash
npx hardhat run scripts/deploy-even-odd.cjs --network xai-testnet
```

### Contract Functions
- `bet(string choice)` - Main betting function (commit step)
- `revealBet()` - Reveal committed bet (reveal step)
- `getGameStatus(address)` - Get player's current game status
- `getLastResult(address)` - Get player's last bet result
- `hasFreeSpin(address)` - Check if player has free spin available
- `totalWinnings(address)` - Get player's cumulative winnings (NEW)
- `withdraw()` - Owner function to withdraw contract balance

### Game Flow
1. Player calls `bet("odd" or "even")` with 1000 WEI
2. Contract stores choice and calls CommitRevealRandomness
3. Player calls `revealBet()` to get random result
4. If won: receives 1400 WEI + free spin flag activated + winnings accumulated
5. Free spins can be used by calling `bet(choice, 0)` (no value needed)

### Testing
- ✅ Contract deployment successful
- ✅ Contract funded successfully
- ✅ Basic functionality tests passed
- ✅ getGameStatus and getLastResult working
- ✅ Cumulative winnings tracking implemented 