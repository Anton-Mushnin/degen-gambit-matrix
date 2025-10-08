/**
 * DiceRun Contract Deployment Script
 *
 * DEPLOYMENT INSTRUCTIONS:
 *
 * 1. Local deployment (for testing):
 *    node src/games/dice-run/scripts/deploy-dice-run.cjs
 *
 * 2. Network deployment (see hardhat.config.cjs for available networks):
 *    npx hardhat run src/games/dice-run/scripts/deploy-dice-run.cjs --network <network-name>
 *
 * REQUIREMENTS:
 * - Set DEPLOYMENT_KEY in .env file with your private key
 * - Ensure you have testnet tokens for the target network
 * - For XAI testnet, get tokens from: https://faucet.quicknode.com/xai
 *
 * NETWORK VERIFICATION:
 * - Local: Account balance will be ~10000 ETH, address starts with 0xf39F...
 * - Testnet: Account balance will be realistic, address matches your wallet
 */

const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying DiceRun contract...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  console.log("💰 Account balance:", (await deployer.getBalance()).toString());

  // Contract parameters
  const betAmount = ethers.BigNumber.from("100"); // 100 WEI
  const basicPayoutMultiplier = 57500; // 5.75x (57500 basis points)
  const streakBankShare3 = 300; // 3% for streak of 3 (300 basis points)
  const streakBankShare4 = 700; // 7% for streak of 4 (700 basis points)
  const streakBankShare5 = 1500; // 15% for streak of 5 (1500 basis points)
  const streakBankShare6 = 3000; // 30% for streak of 6 (3000 basis points)
  const investmentFeePercent = 100; // 1% investment fee (100 basis points)

  console.log("📋 Contract parameters:");
  console.log("- Bet amount:", betAmount.toString(), "WEI");
  console.log("- Basic payout multiplier:", basicPayoutMultiplier, "(5.75x)");
  console.log("- Streak bank share 3:", streakBankShare3, "(3%)");
  console.log("- Streak bank share 4:", streakBankShare4, "(7%)");
  console.log("- Streak bank share 5:", streakBankShare5, "(15%)");
  console.log("- Streak bank share 6:", streakBankShare6, "(30%)");
  console.log("- Investment fee percent:", investmentFeePercent, "(1%)");

  // Deploy the DiceRun contract
  const DiceRun = await ethers.getContractFactory("DiceRun");
  const diceRun = await DiceRun.deploy(
    betAmount,
    basicPayoutMultiplier,
    streakBankShare3,
    streakBankShare4,
    streakBankShare5,
    streakBankShare6,
    investmentFeePercent
  );

  await diceRun.deployed();

  console.log("✅ DiceRun deployed to:", diceRun.address);
  console.log("🔗 Contract address:", diceRun.address);



  // Verify deployment
  console.log("\n📋 Contract verification:");
  console.log("- Bet amount:", (await diceRun.getBetAmount()).toString(), "WEI");
  console.log("- Basic payout multiplier:", (await diceRun.getBasicPayoutMultiplier()).toString());

  const streakShares = await diceRun.getStreakBankShares();
  console.log("- Streak bank shares:", streakShares.map(s => s.toString()));

  console.log("- Investment fee percent:", (await diceRun.getInvestmentFeePercent()).toString());
  console.log("- Bank balance:", (await diceRun.getBankBalance()).toString(), "WEI");

  // Test basic functionality
  console.log("\n🧪 Testing basic functionality...");

  try {
    // Test getPlayerCurrentStreak for deployer
    const streak = await diceRun.getPlayerCurrentStreak(deployer.address);
    console.log("✅ getPlayerCurrentStreak works:", streak);

    // Test getPlayerTotalWinnings for deployer
    const winnings = await diceRun.getPlayerTotalWinnings(deployer.address);
    console.log("✅ getPlayerTotalWinnings works:", winnings.toString());

    // Test getPlayerCurrentStreak for deployer
    const currentStreak = await diceRun.getPlayerCurrentStreak(deployer.address);
    console.log("✅ getPlayerCurrentStreak works:", currentStreak);

    // Test getBankBalance
    const bankBalance = await diceRun.getBankBalance();
    console.log("✅ getBankBalance works:", bankBalance.toString());

    // Test getBestStreak
    const [bestStreakLength, bestStreakPlayer] = await diceRun.getBestStreak();
    console.log("✅ getBestStreak works:", bestStreakLength, bestStreakPlayer);

    // Test getDiceStats for number 1
    const [occurrences, bets, wins] = await diceRun.getDiceStats(1);
    console.log("✅ getDiceStats works:", occurrences.toString(), bets.toString(), wins.toString());

    // Test hasCommit (inherited from CommitRevealRandomness)
    const hasCommit = await diceRun.hasCommit(deployer.address);
    console.log("✅ hasCommit works:", hasCommit);

    console.log("✅ Basic functionality test passed!");
  } catch (error) {
    console.log("❌ Basic functionality test failed:", error.message);
  }

  console.log("\n🎉 Deployment completed successfully!");
  console.log("📱 Contract ready for use");
  console.log("🎲 Dice Run game is ready to play!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("💥 Deployment failed:", error);
    process.exit(1);
  });
