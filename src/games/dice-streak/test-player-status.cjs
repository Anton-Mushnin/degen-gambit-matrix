const { ethers } = require("hardhat");

async function main() {
  console.log("👤 Checking player status on DiceStreak contract...");
  
  // Contract address
  const contractAddress = "0xCfD6407737Ee7569a9c96fc6803f2b99b8B5E69d";
  
  if (contractAddress === "0x0000000000000000000000000000000000000000") {
    console.log("❌ Please update the contract address in this script first");
    return;
  }
  
  try {
    // Get player account
    const [player] = await ethers.getSigners();
    console.log("👤 Player Address:", player.address);
    
    // Get contract instance
    const DiceStreak = await ethers.getContractFactory("DiceStreak");
    const diceStreak = DiceStreak.attach(contractAddress);
    
    console.log("\n📋 Player Status:");
    
    // Player streak
    const streak = await diceStreak.getPlayerStreak(player.address);
    console.log("- Current Streak:", streak.length > 0 ? streak.join(", ") : "None");
    
    // Total winnings
    const winnings = await diceStreak.getPlayerTotalWinnings(player.address);
    console.log("- Total Winnings:", ethers.utils.formatEther(winnings), "ETH");
    
    // Game status
    const gameStatus = await diceStreak.getGameStatus(player.address);
    const statusText = gameStatus === 0 ? "Dice Ready" : gameStatus === 1 ? "Rolling" : "Claiming";
    console.log("- Game Status:", statusText);
    
    // Last bet result
    const lastResult = await diceStreak.getLastBetResult(player.address);
    const resultText = lastResult === 0 ? "None" : lastResult === 1 ? "Win" : "Loss";
    console.log("- Last Bet Result:", resultText);
    
    // Has commit
    const hasCommit = await diceStreak.hasCommit(player.address);
    console.log("- Has Pending Commit:", hasCommit);
    
    // Player ETH balance
    const balance = await player.getBalance();
    console.log("- ETH Balance:", ethers.utils.formatEther(balance), "ETH");
    
    console.log("\n✅ Player status check completed");
    
  } catch (error) {
    console.log("❌ Error checking player status:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("💥 Script failed:", error);
    process.exit(1);
  });
