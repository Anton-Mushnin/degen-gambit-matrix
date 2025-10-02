const { ethers } = require('hardhat');

async function main() {
  console.log("🚀 Deploying DiceStreakDev contract to XAI Testnet...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  console.log("💰 Account balance:", ethers.utils.formatEther(await deployer.getBalance()), "ETH");

  // Contract parameters
  const betAmount = ethers.BigNumber.from("10"); // 1 wei
  const payoutMultiplier = 5500; // 5.5x (5500 basis points)

  console.log("📋 Contract parameters:");
  console.log("- Bet amount:", betAmount.toString(), "WEI");
  console.log("- Payout multiplier:", payoutMultiplier, "(5.5x)");

  // Deploy the DiceStreakDev contract
  const DiceStreakDev = await ethers.getContractFactory("DiceStreakDev");
  const diceStreakDev = await DiceStreakDev.deploy(betAmount, payoutMultiplier);

  await diceStreakDev.deployed();

  console.log("✅ DiceStreakDev deployed to:", diceStreakDev.address);

  // Fund the contract with some ETH for payouts
  const fundingAmount = ethers.BigNumber.from("1000"); // 1000 wei
  console.log(`💰 Funding contract with ${fundingAmount.toString()} WEI for payouts...`);

  const fundTx = await deployer.sendTransaction({
    to: diceStreakDev.address,
    value: fundingAmount
  });
  await fundTx.wait();
  console.log("✅ Contract funded successfully");

  // Verify deployment
  console.log("\n📋 Contract verification:");
  console.log("- Bet amount:", ethers.utils.formatEther(await diceStreakDev.getBetAmount()), "ETH");
  console.log("- Payout multiplier:", (await diceStreakDev.getPayoutMultiplier()).toString());
  console.log("- Bank balance:", ethers.utils.formatEther(await diceStreakDev.getBankBalance()), "ETH");

  console.log("\n🎉 Deployment completed successfully!");
  console.log("🎲 Contract address:", diceStreakDev.address);

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("💥 Deployment failed:", error);
    process.exit(1);
  });