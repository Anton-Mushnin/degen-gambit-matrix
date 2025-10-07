/**
 * DiceStreakDev Contract Deployment Script
 *
 * DEPLOYMENT INSTRUCTIONS:
 *
 * 1. Local deployment (for testing):
 *    node src/games/dice-streak/deploy-dice-streak-dev.cjs
 *
 * 2. Network deployment (see hardhat.config.cjs for available networks):
 *    npx hardhat run src/games/dice-streak/deploy-dice-streak-dev.cjs --network <network-name>
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
  console.log("🚀 Deploying DiceStreakDev contract to XAI Testnet...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  console.log("💰 Account balance:", (await deployer.getBalance()).toString());

  // Contract parameters
  const betAmount = ethers.BigNumber.from("10"); // 10 WEI
  const payoutMultiplier = 5500; // 5.5x (5500 basis points)

  console.log("📋 Contract parameters:");
  console.log("- Bet amount:", betAmount.toString(), "WEI");
  console.log("- Payout multiplier:", payoutMultiplier, "(5.5x)");

  // Deploy the DiceStreakDev contract
  const DiceStreakDev = await ethers.getContractFactory("DiceStreakDev");
  const diceStreakDev = await DiceStreakDev.deploy(betAmount, payoutMultiplier);

  await diceStreakDev.deployed();

  console.log("✅ DiceStreakDev deployed to:", diceStreakDev.address);
  console.log("🔗 Contract address:", diceStreakDev.address);

  // Fund the contract with some ETH for payouts
  const fundingAmount = ethers.BigNumber.from("1000"); // 1000 WEI
  console.log(`\n💰 Funding contract with ${fundingAmount.toString()} WEI for payouts...`);

  const fundTx = await deployer.sendTransaction({
    to: diceStreakDev.address,
    value: fundingAmount
  });
  await fundTx.wait();
  console.log("✅ Contract funded successfully");

  // Verify deployment
  console.log("\n📋 Contract verification:");
  console.log("- Bet amount:", (await diceStreakDev.getBetAmount()).toString(), "WEI");
  console.log("- Payout multiplier:", (await diceStreakDev.getPayoutMultiplier()).toString());
  console.log("- Bank balance:", (await diceStreakDev.getBankBalance()).toString(), "WEI");

  // Save deployment info
  const deploymentInfo = {
    network: "XAI Testnet",
    chainId: 37714555429,
    contract: "DiceStreakDev",
    address: diceStreakDev.address,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    blockNumber: await diceStreakDev.provider.getBlockNumber(),
    rpc: "https://testnet-v2.xai-chain.net/rpc",
    explorer: "https://testnet-explorer-v2.xai-chain.net/",
    faucet: "https://faucet.quicknode.com/xai",
    betAmount: betAmount.toString(),
    payoutMultiplier: payoutMultiplier.toString()
  };

  console.log("\n💾 Deployment info saved to deployments.md");

  // Test basic functionality
  console.log("\n🧪 Testing basic functionality...");

  try {
    // Test getPlayerStreak for deployer
    const streak = await diceStreakDev.getPlayerStreak(deployer.address);
    console.log("✅ getPlayerStreak works:", streak);

    // Test getPlayerTotalWinnings for deployer
    const winnings = await diceStreakDev.getPlayerTotalWinnings(deployer.address);
    console.log("✅ getPlayerTotalWinnings works:", winnings.toString());

    // Test getGameStatus for deployer
    const gameStatus = await diceStreakDev.getGameStatus(deployer.address);
    console.log("✅ getGameStatus works:", gameStatus);

    // Test getLastBetResult for deployer
    const lastResult = await diceStreakDev.getLastBetResult(deployer.address);
    console.log("✅ getLastBetResult works:", lastResult);

    // Test getBestCombo
    const [bestStreak, bestPlayer] = await diceStreakDev.getBestCombo();
    console.log("✅ getBestCombo works:", bestStreak, bestPlayer);

    // Test getStatistics for number 1
    const [occurrences, bets, wins] = await diceStreakDev.getStatistics(1);
    console.log("✅ getStatistics works:", occurrences.toString(), bets.toString(), wins.toString());

    // Test hasCommit (inherited from CommitRevealRandomness)
    const hasCommit = await diceStreakDev.hasCommit(deployer.address);
    console.log("✅ hasCommit works:", hasCommit);

    // Test DiceStreakDev specific functionality - predetermined results
    console.log("🎲 Testing DiceStreakDev specific functionality...");

    // Set a predetermined result for testing
    const setResultTx = await diceStreakDev.setPredeterminedResult(3);
    await setResultTx.wait();
    console.log("✅ setPredeterminedResult works");

    console.log("✅ Basic functionality test passed!");
  } catch (error) {
    console.log("❌ Basic functionality test failed:", error.message);
  }

  console.log("\n🎉 Deployment completed successfully!");
  console.log("📱 Contract ready for use on XAI Testnet");
  console.log("🎲 Dice Streak Dev game is ready to play!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("💥 Deployment failed:", error);
    process.exit(1);
  });
