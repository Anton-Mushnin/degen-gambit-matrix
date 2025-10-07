const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Checking DiceStreak contract status...");
  
  // Get contract address from config
  const config = require('./config.cjs');
  const contractAddress = config.production.contractAddress;
  
  if (contractAddress === "0x0000000000000000000000000000000000000000") {
    console.log("❌ Please update the contract address in this script first");
    return;
  }
  
  try {
    // Get contract instance
    const DiceStreak = await ethers.getContractFactory("DiceStreak");
    const diceStreak = DiceStreak.attach(contractAddress);
    
    console.log("📋 Contract Status:");
    console.log("- Contract Address:", contractAddress);
    console.log("- Bet Amount:", (await diceStreak.getBetAmount()).toString(), "WEI");
    console.log("- Payout Multiplier:", (await diceStreak.getPayoutMultiplier()).toString());
    console.log("- Bank Balance:", (await diceStreak.getBankBalance()).toString(), "WEI");
    
    const [bestStreak, bestPlayer] = await diceStreak.getBestCombo();
    console.log("- Best Combo:", bestStreak, "by", bestPlayer);
    
    console.log("\n📊 Statistics:");
    for (let i = 1; i <= 6; i++) {
      const [occurrences, bets, wins] = await diceStreak.getStatistics(i);
      console.log(`- Number ${i}: ${occurrences} occurrences, ${bets} bets, ${wins} wins`);
    }
    
    console.log("\n✅ Contract status check completed");
    
  } catch (error) {
    console.log("❌ Error checking contract status:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("💥 Script failed:", error);
    process.exit(1);
  });
