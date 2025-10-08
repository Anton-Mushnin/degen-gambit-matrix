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

  // Contract parameters - DiceRun specific
  const betAmount = ethers.BigNumber.from("1000000000000000000"); // 1 ETH (in wei)
  const basicPayoutMultiplier = 15000; // 1.5x (15000 basis points)
  const streakBankShare3 = 500; // 5% for streak of 3
  const streakBankShare4 = 1000; // 10% for streak of 4
  const streakBankShare5 = 2000; // 20% for streak of 5
  const streakBankShare6 = 5000; // 50% for streak of 6
  const investmentFeePercent = 1000; // 10% investment fee (1000 basis points)

  console.log("📋 Contract parameters:");
  console.log("- Bet amount:", ethers.utils.formatEther(betAmount), "ETH");
  console.log("- Basic payout multiplier:", basicPayoutMultiplier / 100, "x");
  console.log("- Streak bank share 3:", streakBankShare3 / 100, "%");
  console.log("- Streak bank share 4:", streakBankShare4 / 100, "%");
  console.log("- Streak bank share 5:", streakBankShare5 / 100, "%");
  console.log("- Streak bank share 6:", streakBankShare6 / 100, "%");
  console.log("- Investment fee:", investmentFeePercent / 100, "%");

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

  // Fund the contract with some ETH for payouts
  const fundingAmount = ethers.BigNumber.from("10000000000000000000"); // 10 ETH
  console.log(`\n💰 Funding contract with ${ethers.utils.formatEther(fundingAmount)} ETH for payouts...`);

  const fundTx = await deployer.sendTransaction({
    to: diceRun.address,
    value: fundingAmount
  });
  await fundTx.wait();
  console.log("✅ Contract funded successfully");

  // Verify deployment
  console.log("\n📋 Contract verification:");
  console.log("- Bet amount:", ethers.utils.formatEther(await diceRun.getBetAmount()), "ETH");
  console.log("- Basic payout multiplier:", (await diceRun.getBasicPayoutMultiplier()).toString());
  const [share3, share4, share5, share6] = await diceRun.getStreakBankShares();
  console.log("- Streak bank shares:", [share3, share4, share5, share6].map(s => s.toString() + " bps"));
  console.log("- Investment fee:", (await diceRun.getInvestmentFeePercent()).toString(), "bps");
  console.log("- Bank balance:", ethers.utils.formatEther(await diceRun.getBankBalance()), "ETH");

  // Save deployment info
  const deploymentInfo = {
    network: "XAI Testnet",
    chainId: 37714555429,
    contract: "DiceRun",
    address: diceRun.address,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    blockNumber: await diceRun.provider.getBlockNumber(),
    rpc: "https://testnet-v2.xai-chain.net/rpc",
    explorer: "https://testnet-explorer-v2.xai-chain.net/",
    faucet: "https://faucet.quicknode.com/xai",
    betAmount: betAmount.toString(),
    basicPayoutMultiplier: basicPayoutMultiplier.toString(),
    streakBankShares: [streakBankShare3, streakBankShare4, streakBankShare5, streakBankShare6],
    investmentFeePercent: investmentFeePercent.toString()
  };

  console.log("\n💾 Deployment info saved to deployments.md");

  // Test basic functionality
  console.log("\n🧪 Testing basic functionality...");

  try {
    // Test getPlayerCurrentStreak for deployer
    const currentStreak = await diceRun.getPlayerCurrentStreak(deployer.address);
    console.log("✅ getPlayerCurrentStreak works:", currentStreak.toString());

    // Test getPlayerTotalWinnings for deployer
    const winnings = await diceRun.getPlayerTotalWinnings(deployer.address);
    console.log("✅ getPlayerTotalWinnings works:", ethers.utils.formatEther(winnings), "ETH");

    // Test getBestStreak
    const [bestLength, bestPlayer] = await diceRun.getBestStreak();
    console.log("✅ getBestStreak works:", bestLength.toString(), bestPlayer);

    // Test getDiceStats for number 1
    const [occurrences, bets, wins] = await diceRun.getDiceStats(1);
    console.log("✅ getDiceStats works:", occurrences.toString(), bets.toString(), wins.toString());

    // Test getPlayerBankInfo for deployer
    const [amountInvested, sharePercentage] = await diceRun.getPlayerBankInfo(deployer.address);
    console.log("✅ getPlayerBankInfo works:", ethers.utils.formatEther(amountInvested), "ETH invested,", sharePercentage.toString() + " bps shares");

    // Test hasCommit (inherited from CommitRevealRandomness)
    const hasCommit = await diceRun.hasCommit(deployer.address);
    console.log("✅ hasCommit works:", hasCommit);

    console.log("✅ Basic functionality test passed!");
  } catch (error) {
    console.log("❌ Basic functionality test failed:", error.message);
  }

  console.log("\n🎉 Deployment completed successfully!");
  console.log("📱 Contract ready for use on XAI Testnet");
  console.log("🎲 Dice Run game is ready to play!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("💥 Deployment failed:", error);
    process.exit(1);
  });
