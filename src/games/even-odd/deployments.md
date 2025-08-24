# Even-Odd Game Deployments

## Xai Testnet v2
- **Network**: Xai Testnet v2
- **Chain ID**: 37714555429
- **RPC**: https://testnet-v2.xai-chain.net/rpc
- **Explorer**: https://sepolia.xaiscan.io/
- **Faucet**: https://faucet.quicknode.com/xai

### Deployment Details
- **Contract Address**: [To be filled after deployment]
- **Transaction Hash**: [To be filled after deployment]
- **Block Number**: [To be filled after deployment]
- **Deployer**: [To be filled after deployment]
- **Gas Used**: [To be filled after deployment]

### Contract Constants
- **Bet Amount**: 1000 WEI
- **Win Payout**: 1400 WEI (1.4x multiplier)

### Deployment Command
```bash
cd src/games/even-odd/contract
npx hardhat run deploy.js --config hardhat.config.js --network xai-testnet
```

### Contract Functions
- `betOdd()` - Bet on odd number
- `betEven()` - Bet on even number
- `getPlayerState(address)` - Get player statistics
- `getGameConstants()` - Get bet amount and payout
- `getContractBalance()` - Get contract balance 