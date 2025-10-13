const { ethers } = require("hardhat");

async function main() {
  console.log("🎲 Testing DiceStreak play functionality...");
  
  // Get contract address from config
  const config = require('./config.cjs');
  const contractAddress = config.production.contractAddress;
  
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

    // Play with guess 3 (commit phase)
    const playTx = await diceStreak.play(3, { value: betAmount });
    console.log("📝 Play transaction sent:", playTx.hash);

    await playTx.wait();
    console.log("✅ Play transaction confirmed (commit phase)");

    // Check new game status
    const newGameStatus = await diceStreak.getGameStatus(player.address);
    const statusText = newGameStatus === 0 ? "Dice Ready" : newGameStatus === 1 ? "Rolling" : "Claiming";
    console.log("📊 New Game Status:", statusText);

    // Check if player has commit
    const hasCommit = await diceStreak.hasCommit(player.address);
    console.log("🔒 Has Commit:", hasCommit);

    if (hasCommit) {
      console.log("\n🔍 Inspecting outcome before deciding to accept...");

      try {
        // Wait a moment for block to be mined (needed for inspectOutcome)
        console.log("⏳ Waiting for next block to be mined...");
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Inspect the outcome
        const [diceResult, prizeValue, description] = await diceStreak.inspectOutcome(player.address);
        console.log("🎲 Inspected Outcome: dice rolled", diceResult);
        console.log("💰 Prize value:", ethers.utils.formatEther(prizeValue), "ETH");
        console.log("📝 Description:", description);
        console.log("🎯 Your guess was:", 3);
        console.log("🏆 Result:", diceResult === 3 ? "WIN!" : "LOSS");

        if (diceResult === 3) {
          console.log("💡 Good outcome! Accepting the result...");
        } else {
          console.log("💡 Bad outcome. Could choose to wait for reveal window to expire instead...");
          console.log("   But for testing, we'll accept anyway.");
        }

        console.log("\n✅ Accept/Call accept() function to complete the game");

      } catch (error) {
        console.log("⚠️  Inspect failed (probably need to wait for next block):", error.message);
        console.log("💡 Call inspectOutcome() later, then accept() to complete");
      }
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
