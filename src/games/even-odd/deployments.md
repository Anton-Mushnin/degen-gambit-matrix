# Even-Odd Game Deployments

## Xai Testnet v2
- **Network**: Xai Testnet v2
- **Chain ID**: 37714555429
- **RPC**: https://testnet-v2.xai-chain.net/rpc
- **Explorer**: https://sepolia.xaiscan.io/
- **Faucet**: https://faucet.quicknode.com/xai

### ✅ Deployment Details - DEPLOYED
- **Contract Address**: `0x6aEEccD5eB7f9bABA25F052d0608CC4E162786B8`
- **Deployer**: `0x4eD919172bD08D74831f2914aAAe8edA690d08Ab`
- **Status**: Successfully deployed
- **Deployment Date**: January 16, 2025

### Contract Constants
- **Bet Amount**: 1000 WEI
- **Win Payout**: 1400 WEI (1.4x multiplier)
- **Reveal Delay**: 3 blocks
- **Randomness Method**: Future block hash (commit-reveal pattern)

### Deployment Command
```bash
npx hardhat run scripts/deploy-even-odd.js --network xai-testnet
```

### Contract Functions
- `placeBet(bool choice)` - Main betting function (commit step)
- `revealBet()` - Reveal committed bet (reveal step)
- `betOdd()` - Convenience function for odd bet
- `betEven()` - Convenience function for even bet
- `getPlayerState(address)` - Get player statistics and pending bet info
- `getGameConstants()` - Get bet amount, payout, and reveal delay
- `getContractBalance()` - Get contract balance 