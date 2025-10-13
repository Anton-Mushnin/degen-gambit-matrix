const { ethers } = require('hardhat');

async function main() {
  console.log("🚀 Deploying DiceStreak contract to XAI Testnet...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  console.log("💰 Account balance:", ethers.utils.formatEther(await deployer.getBalance()), "ETH");

  // Contract parameters
  const betAmount = ethers.BigNumber.from("10"); // 10 wei
  const payoutMultiplier = 5500; // 5.5x (5500 basis points)

  console.log("📋 Contract parameters:");
  console.log("- Bet amount:", betAmount.toString(), "WEI");
  console.log("- Payout multiplier:", payoutMultiplier, "(5.5x)");

  // Deploy the DiceStreak contract
  const DiceStreak = await ethers.getContractFactory("DiceStreak");
  const diceStreak = await DiceStreak.deploy(betAmount, payoutMultiplier);

  await diceStreak.deployed();

  console.log("✅ DiceStreak deployed to:", diceStreak.address);

  // Fund the contract with some ETH for payouts
  const fundingAmount = ethers.BigNumber.from("1000"); // 1000 wei
  console.log(`💰 Funding contract with ${fundingAmount.toString()} WEI for payouts...`);

  const fundTx = await deployer.sendTransaction({
    to: diceStreak.address,
    value: fundingAmount
  });
  await fundTx.wait();
  console.log("✅ Contract funded successfully");

  // Verify deployment
  console.log("\n📋 Contract verification:");
  console.log("- Bet amount:", ethers.utils.formatEther(await diceStreak.getBetAmount()), "ETH");
  console.log("- Payout multiplier:", (await diceStreak.getPayoutMultiplier()).toString());
  console.log("- Bank balance:", ethers.utils.formatEther(await diceStreak.getBankBalance()), "ETH");

  console.log("\n🎉 Deployment completed successfully!");
  console.log("🎲 Contract address:", diceStreak.address);

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("💥 Deployment failed:", error);
    process.exit(1);
  });
