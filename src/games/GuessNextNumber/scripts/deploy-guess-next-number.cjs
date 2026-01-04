/**
 * GuessNextNumber Contract Deployment Script
 * 
 * DEPLOYMENT INSTRUCTIONS:
 * 
 * 1. Network deployment:
 *    npx hardhat run src/games/GuessNextNumber/scripts/deploy-guess-next-number.cjs --network xaiTestnet
 * 
 * REQUIREMENTS:
 * - Set DEPLOYMENT_KEY in .env file with your private key
 * - Ensure you have testnet tokens for the target network
 * - For XAI testnet, get tokens from: https://faucet.quicknode.com/xai
 */

const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying GuessNextNumber contract to XAI Testnet...");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  console.log("💰 Account balance:", (await deployer.getBalance()).toString());

  // Contract parameters
  const costOfPlay = ethers.BigNumber.from("10"); // 10 WEI
  const payoutMultiplier = 5800; // 5.8x (5800 basis points)
  
  console.log("📋 Contract parameters:");
  console.log("- Cost of play:", costOfPlay.toString(), "WEI");
  console.log("- Payout multiplier:", payoutMultiplier, "(5.8x)");
  console.log("- Deposit fee: 1%");
  console.log("- Streak bonuses: 3→1%, 4→5%, 5→15%, 6→50%");

  // Deploy the GuessNextNumber contract
  const GuessNextNumber = await ethers.getContractFactory("GuessNextNumber");
  const guessNextNumber = await GuessNextNumber.deploy(costOfPlay, payoutMultiplier);
  
  await guessNextNumber.deployed();
  
  console.log("✅ GuessNextNumber deployed to:", guessNextNumber.address);
  
  // Verify deployment
  console.log("\n📋 Contract verification:");
  console.log("- Cost of play:", (await guessNextNumber.costOfPlay()).toString(), "WEI");
  console.log("- Payout multiplier:", (await guessNextNumber.payoutMultiplier()).toString());
  console.log("- Deposit fee:", (await guessNextNumber.depositFeePercent()).toString(), "%");
  console.log("- Bank balance:", (await guessNextNumber.getBankBalance()).toString(), "WEI");
  
  // Test getters
  console.log("\n🧪 Testing getters...");
  
  try {
    const [bonus3, bonus4, bonus5, bonus6] = await guessNextNumber.getStreakBonuses();
    console.log("✅ getStreakBonuses works:", bonus3.toString(), bonus4.toString(), bonus5.toString(), bonus6.toString());
    
    const [streakLength, streakPlayer] = await guessNextNumber.getBestStreak();
    console.log("✅ getBestStreak works:", streakLength, streakPlayer);
    
    const playerStatus = await guessNextNumber.getPlayerStatus(deployer.address);
    console.log("✅ getPlayerStatus works:", playerStatus);
    
    const playerStreak = await guessNextNumber.getPlayerStreak(deployer.address);
    console.log("✅ getPlayerStreak works:", playerStreak);
    
    const playerWinnings = await guessNextNumber.getPlayerTotalWinnings(deployer.address);
    console.log("✅ getPlayerTotalWinnings works:", playerWinnings.toString());
    
    const playerShare = await guessNextNumber.getPlayerShare(deployer.address);
    console.log("✅ getPlayerShare works:", playerShare.toString());
    
    console.log("✅ All getters working!");
  } catch (error) {
    console.log("❌ Getter test failed:", error.message);
  }
  
  console.log("\n🎉 Deployment completed successfully!");
  console.log("📱 Contract ready for use on XAI Testnet");
  console.log("🎲 GuessNextNumber game is ready!");
  console.log("\n⚠️  Note: Bank needs funding before players can play (minimum 11x bet = 110 WEI)");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("💥 Deployment failed:", error);
    process.exit(1);
  });

