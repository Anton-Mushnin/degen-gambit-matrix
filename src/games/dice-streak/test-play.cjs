const { ethers } = require("hardhat");

async function main() {
  console.log("🎲 Testing DiceStreak play functionality...");
  
  // Contract address
  const contractAddress = "0x73380E6f3C2f9d3811f6Ab13A6623906ecFCa9AD";
  
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
    
    // Check player balance
    const balance = await player.getBalance();
    console.log("💰 Player Balance:", ethers.utils.formatEther(balance), "ETH");
    
    // Get bet amount
    const betAmount = await diceStreak.getBetAmount();
    console.log("🎯 Bet Amount:", ethers.utils.formatEther(betAmount), "ETH");
    
    if (balance.lt(betAmount)) {
      console.log("❌ Insufficient balance to play");
      return;
    }
    
    // Check game status
    const gameStatus = await diceStreak.getGameStatus(player.address);
    if (gameStatus !== 0) {
      console.log("❌ Game not ready. Current status:", gameStatus);
      return;
    }
    
    console.log("\n🎲 Playing with guess 3...");
    
    // Play with guess 3
    const playTx = await diceStreak.play(3, { value: betAmount });
    console.log("📝 Play transaction sent:", playTx.hash);
    
    await playTx.wait();
    console.log("✅ Play transaction confirmed");
    
    // Check new game status
    const newGameStatus = await diceStreak.getGameStatus(player.address);
    const statusText = newGameStatus === 0 ? "Dice Ready" : newGameStatus === 1 ? "Rolling" : "Claiming";
    console.log("📊 New Game Status:", statusText);
    
    // Check if player has commit
    const hasCommit = await diceStreak.hasCommit(player.address);
    console.log("🔒 Has Commit:", hasCommit);
    
    if (hasCommit) {
      console.log("\n⏳ Waiting for reveal...");
      console.log("💡 Call reveal() function to complete the game");
    }
    
    console.log("\n✅ Play test completed");
    
  } catch (error) {
    console.log("❌ Error during play test:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("💥 Script failed:", error);
    process.exit(1);
  });
