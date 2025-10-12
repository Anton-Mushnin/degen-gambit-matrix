/**
 * DiceRunDev Contract Deployment Script
 *
 * DEPLOYMENT INSTRUCTIONS:
 *
 * 1. Local deployment (for testing):
 *    node src/games/dice-run/scripts/deploy-dice-run-dev.cjs
 *
 * 2. Network deployment (see hardhat.config.cjs for available networks):
 *    npx hardhat run src/games/dice-run/scripts/deploy-dice-run-dev.cjs --network <network-name>
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
  console.log("🚀 Deploying DiceRunDev contract to XAI Testnet...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  console.log("💰 Account balance:", (await deployer.getBalance()).toString());

  // Contract parameters (same as production DiceRun)
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

  // Deploy the DiceRunDev contract
  const DiceRunDev = await ethers.getContractFactory("DiceRunDev");
  const diceRunDev = await DiceRunDev.deploy(
    betAmount,
    basicPayoutMultiplier,
    streakBankShare3,
    streakBankShare4,
    streakBankShare5,
    streakBankShare6,
    investmentFeePercent
  );

  await diceRunDev.deployed();

  console.log("✅ DiceRunDev deployed to:", diceRunDev.address);
  console.log("🔗 Contract address:", diceRunDev.address);

  // Verify deployment
  console.log("\n📋 Contract verification:");
  console.log("- Bet amount:", (await diceRunDev.getBetAmount()).toString(), "WEI");
  console.log("- Basic payout multiplier:", (await diceRunDev.getBasicPayoutMultiplier()).toString());

  const streakShares = await diceRunDev.getStreakBankShares();
  console.log("- Streak bank shares:", streakShares.map(s => s.toString()));

  console.log("- Investment fee percent:", (await diceRunDev.getInvestmentFeePercent()).toString());
  console.log("- Bank balance:", (await diceRunDev.getBankBalance()).toString(), "WEI");

  // Test basic functionality
  console.log("\n🧪 Testing basic functionality...");

  try {
    // Test getPlayerCurrentStreak for deployer
    const streak = await diceRunDev.getPlayerCurrentStreak(deployer.address);
    console.log("✅ getPlayerCurrentStreak works:", streak);

    // Test getPlayerTotalWinnings for deployer
    const winnings = await diceRunDev.getPlayerTotalWinnings(deployer.address);
    console.log("✅ getPlayerTotalWinnings works:", winnings.toString());

    // Test getBankBalance
    const bankBalance = await diceRunDev.getBankBalance();
    console.log("✅ getBankBalance works:", bankBalance.toString());

    // Test getBestStreak
    const [bestStreakLength, bestStreakPlayer] = await diceRunDev.getBestStreak();
    console.log("✅ getBestStreak works:", bestStreakLength, bestStreakPlayer);

    // Test getDiceStats for number 1
    const [occurrences, bets, wins] = await diceRunDev.getDiceStats(1);
    console.log("✅ getDiceStats works:", occurrences.toString(), bets.toString(), wins.toString());

    // Test hasCommit (inherited from CommitRevealRandomness)
    const hasCommit = await diceRunDev.hasCommit(deployer.address);
    console.log("✅ hasCommit works:", hasCommit);

    // Test dev-specific functions
    const predeterminedResult = await diceRunDev.getPredeterminedResult(deployer.address);
    console.log("✅ getPredeterminedResult works:", predeterminedResult);

    console.log("✅ Basic functionality test passed!");
  } catch (error) {
    console.log("❌ Basic functionality test failed:", error.message);
  }

  console.log("\n### Additional Dev Features");
  console.log("- `setPredeterminedResult(uint8 result)` - Set predetermined dice result (1-6) or clear with 0");
  console.log("- `getPredeterminedResult(address player)` - Get predetermined result for player");
  console.log("- Predetermined results persist until manually cleared or overwritten");
  console.log("- Falls back to normal randomness when no predetermined result is set");

  console.log("\n🎉 Deployment completed successfully!");
  console.log("📱 Contract ready for development testing");
  console.log("🎲 DiceRunDev game is ready to play with dev features!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("💥 Deployment failed:", error);
    process.exit(1);
  });
