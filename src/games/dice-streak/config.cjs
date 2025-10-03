// DiceStreak contract configuration - single source of truth
// This should match DICE_STREAK_CONTRACT_ADDRESS in index.tsx
module.exports = {
  production: {
    contractAddress: "0x6e60CA85550592627363ecc419Ce2491675A85ff",
    name: "DiceStreak"
  },
  dev: {
    contractAddress: "0x89B28fBa24c5a694d9cCa0738d435Bb35Be615A2",
    name: "DiceStreakDev"
  },
  network: {
    name: "XAI Testnet",
    chainId: 37714555429,
    rpc: "https://testnet-v2.xai-chain.net/rpc",
    explorer: "https://testnet-explorer-v2.xai-chain.net/"
  }
};
