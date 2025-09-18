const { ethers } = require("hardhat");

async function main() {
  console.log("🎯 Testing DiceStreak reveal functionality...");
  
  // Contract address
  const contractAddress = "0x73380E6f3C2f9d3811f6Ab13A6623906ecFCa9AD";
  
  try {
    // Get player account
    const [player] = await ethers.getSigners();
    console.log("👤 Player Address:", player.address);
    
    // Get contract instance
    const DiceStreak = await ethers.getContractFactory("DiceStreak");
    const diceStreak = DiceStreak.attach(contractAddress);
    
    // Check if player has commit
    const hasCommit = await diceStreak.hasCommit(player.address);
    console.log("🔒 Has Commit:", hasCommit);
    
    if (!hasCommit) {
      console.log("❌ No commit to reveal. Play first!");
      return;
    }
    
    // Check game status
    const gameStatus = await diceStreak.getGameStatus(player.address);
    const statusText = gameStatus === 0 ? "Dice Ready" : gameStatus === 1 ? "Rolling" : "Claiming";
    console.log("📊 Game Status:", statusText);
    
    if (gameStatus !== 1) {
      console.log("❌ Game not in rolling phase. Current status:", statusText);
      return;
    }
    
    console.log("\n🎯 Revealing commit...");
    
    // Check available functions
    console.log("Available functions:", Object.keys(diceStreak.functions));
    
    // Try to call reveal with different approaches
    let revealTx;
    try {
      revealTx = await diceStreak["reveal()"]();
      console.log("📝 Reveal transaction sent:", revealTx.hash);
    } catch (error) {
      console.log("❌ Direct reveal failed:", error.message);
      
      // Try calling the parent contract's reveal function
      try {
        revealTx = await diceStreak["reveal(bytes)"]("0x");
        console.log("📝 Parent reveal transaction sent:", revealTx.hash);
      } catch (error2) {
        console.log("❌ Parent reveal also failed:", error2.message);
        return;
      }
    }
    
    await revealTx.wait();
    console.log("✅ Reveal transaction confirmed");
    
    // Check new game status
    const newGameStatus = await diceStreak.getGameStatus(player.address);
    const newStatusText = newGameStatus === 0 ? "Dice Ready" : newGameStatus === 1 ? "Rolling" : "Claiming";
    console.log("📊 New Game Status:", newStatusText);
    
    // Check last bet result
    const lastResult = await diceStreak.getLastBetResult(player.address);
    const resultText = lastResult === 0 ? "None" : lastResult === 1 ? "Win" : "Loss";
    console.log("🎲 Last Bet Result:", resultText);
    
    // Check player streak
    const streak = await diceStreak.getPlayerStreak(player.address);
    console.log("🔥 Current Streak:", streak.length > 0 ? streak.join(", ") : "None");
    
    // Check total winnings
    const winnings = await diceStreak.getPlayerTotalWinnings(player.address);
    console.log("💰 Total Winnings:", ethers.utils.formatEther(winnings), "ETH");
    
    // Check if player has commit now
    const hasCommitAfter = await diceStreak.hasCommit(player.address);
    console.log("🔒 Has Commit After:", hasCommitAfter);
    
    console.log("\n✅ Reveal test completed");
    
  } catch (error) {
    console.log("❌ Error during reveal test:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("💥 Script failed:", error);
    process.exit(1);
  });
