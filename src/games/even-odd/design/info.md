# Even-Odd Game - Data Display List

## Contract Information:
- **Contract Address**: 0xEf506F17e839fc646Ff61605E640e4C78D38ffCF
- **Contract Version**: 1.0.0 (with cumulative winnings tracking)
- **Network**: XAI Testnet v2

## Contract Data (Global):
1. **Pot Balance**; blockchain - contract balance; real-time updates; no animation
2. **Current Block**; blockchain - current block number; 5-second interval; no animation
3. **Bet Amount**; constant - 1000 WEI; no updates; no animation
4. **Payout Amount**; constant - 1400 WEI; no updates; no animation

## Player Data (when connected):
5. **Player Address**; logic - connected wallet; no updates; no animation
6. **Player Balance**; blockchain - native token balance; real-time updates; animation
7. **Has Commit**; contract data - is there a pending bet; updates on commit and reveal; no animation
9. **Free Spin Available**; contract data - earned free spin; updates on reveal; no animation
10. **Total Winnings**; contract data - cumulative winnings; updates on reveal; animation 