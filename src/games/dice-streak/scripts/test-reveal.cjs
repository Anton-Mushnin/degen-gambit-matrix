const { ethers } = require("hardhat");

async function main() {
  console.log("✅ Testing DiceStreak accept functionality...");

  // Get contract address from config
  const config = require('./config.cjs');
  const contractAddress = config.production.contractAddress;

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
    
    console.log("\n🔍 Inspecting outcome before accepting...");

    // First inspect the outcome to see what we're accepting
    try {
      const [diceResult, prizeValue, description] = await diceStreak.inspectOutcome(player.address);
      console.log("🎲 Inspected Outcome: dice rolled", diceResult);
      console.log("💰 Prize value:", ethers.utils.formatEther(prizeValue), "ETH");
      console.log("📝 Description:", description);

      // Get the player's guess from contract state
      const playerData = await diceStreak.players(player.address);
      console.log("🎯 Your guess was:", playerData.pendingGuess);
      console.log("🏆 Result:", diceResult == playerData.pendingGuess ? "WIN!" : "LOSS");

    } catch (error) {
      console.log("⚠️  Could not inspect outcome:", error.message);
      console.log("   Proceeding with accept anyway...");
    }

    console.log("\n✅ Accepting result by calling accept()...");

    // Call the clear accept() function
    let acceptTx;
    try {
      acceptTx = await diceStreak.accept();
      console.log("📝 Accept transaction sent:", acceptTx.hash);
    } catch (error) {
      console.log("❌ Accept failed:", error.message);
      return;
    }

    await acceptTx.wait();
    console.log("✅ Accept transaction confirmed");
    
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
    
    console.log("\n✅ Accept test completed");
    
  } catch (error) {
    console.log("❌ Error during accept test:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("💥 Script failed:", error);
    process.exit(1);
  });
