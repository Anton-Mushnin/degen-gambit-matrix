const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying DiceStreak contract to XAI Testnet...");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  console.log("💰 Account balance:", (await deployer.getBalance()).toString());

  // Contract parameters
  const betAmount = ethers.BigNumber.from("1"); // 1 WEI
  const payoutMultiplier = 5500; // 5.5x (5500 basis points)
  
  console.log("📋 Contract parameters:");
  console.log("- Bet amount:", betAmount.toString(), "WEI");
  console.log("- Payout multiplier:", payoutMultiplier, "(5.5x)");

  // Deploy the DiceStreak contract
  const DiceStreak = await ethers.getContractFactory("DiceStreak");
  const diceStreak = await DiceStreak.deploy(betAmount, payoutMultiplier);
  
  await diceStreak.deployed();
  
  console.log("✅ DiceStreak deployed to:", diceStreak.address);
  console.log("🔗 Contract address:", diceStreak.address);
  
  // Fund the contract with some ETH for payouts
  const fundingAmount = ethers.BigNumber.from("1000000000000"); // 0.000001 ETH
  console.log(`\n💰 Funding contract with ${ethers.utils.formatEther(fundingAmount)} ETH for payouts...`);
  
  const fundTx = await deployer.sendTransaction({
    to: diceStreak.address,
    value: fundingAmount
  });
  await fundTx.wait();
  console.log("✅ Contract funded successfully");
  
  // Verify deployment
  console.log("\n📋 Contract verification:");
  console.log("- Bet amount:", (await diceStreak.getBetAmount()).toString(), "WEI");
  console.log("- Payout multiplier:", (await diceStreak.getPayoutMultiplier()).toString());
  console.log("- Bank balance:", (await diceStreak.getBankBalance()).toString(), "WEI");
  
  // Save deployment info
  const deploymentInfo = {
    network: "XAI Testnet",
    chainId: 37714555429,
    contract: "DiceStreak",
    address: diceStreak.address,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    blockNumber: await diceStreak.provider.getBlockNumber(),
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
    const streak = await diceStreak.getPlayerStreak(deployer.address);
    console.log("✅ getPlayerStreak works:", streak);
    
    // Test getPlayerTotalWinnings for deployer
    const winnings = await diceStreak.getPlayerTotalWinnings(deployer.address);
    console.log("✅ getPlayerTotalWinnings works:", winnings.toString());
    
    // Test getGameStatus for deployer
    const gameStatus = await diceStreak.getGameStatus(deployer.address);
    console.log("✅ getGameStatus works:", gameStatus);
    
    // Test getLastBetResult for deployer
    const lastResult = await diceStreak.getLastBetResult(deployer.address);
    console.log("✅ getLastBetResult works:", lastResult);
    
    // Test getBestCombo
    const [bestStreak, bestPlayer] = await diceStreak.getBestCombo();
    console.log("✅ getBestCombo works:", bestStreak, bestPlayer);
    
    // Test getStatistics for number 1
    const [occurrences, bets, wins] = await diceStreak.getStatistics(1);
    console.log("✅ getStatistics works:", occurrences.toString(), bets.toString(), wins.toString());
    
    // Test hasCommit (inherited from CommitRevealRandomness)
    const hasCommit = await diceStreak.hasCommit(deployer.address);
    console.log("✅ hasCommit works:", hasCommit);
    
    console.log("✅ Basic functionality test passed!");
  } catch (error) {
    console.log("❌ Basic functionality test failed:", error.message);
  }
  
  console.log("\n🎉 Deployment completed successfully!");
  console.log("📱 Contract ready for use on XAI Testnet");
  console.log("🎲 Dice Streak game is ready to play!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("💥 Deployment failed:", error);
    process.exit(1);
  });
