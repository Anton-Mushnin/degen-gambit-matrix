const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying DiceStreak contract...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  console.log("💰 Account balance:", (await deployer.getBalance()).toString());

  // Contract parameters
  const betAmount = ethers.BigNumber.from("1"); // 10 WEI
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
  const fundingAmount = ethers.BigNumber.from("1000000000000000"); // 0.001 ETH
  console.log(`\n💰 Funding contract with ${ethers.utils.formatEther(fundingAmount)} ETH for payouts...`);

  const fundTx = await deployer.sendTransaction({
    to: diceStreak.address,
    value: fundingAmount
  });
  await fundTx.wait();
  console.log("✅ Contract funded successfully");

  console.log("\n🎉 Deployment completed successfully!");
  console.log("🎲 Contract address:", diceStreak.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("💥 Deployment failed:", error);
    process.exit(1);
  });
