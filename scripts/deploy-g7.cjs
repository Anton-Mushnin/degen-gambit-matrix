const { ethers } = require("hardhat");

async function main() {
  console.log("🎲 Deploying MatrixDiceSimple to Game7 Testnet...");
  
  // Get the contract factory
  const MatrixDiceSimple = await ethers.getContractFactory("MatrixDiceSimple");
  
  // Get deployer account
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.utils.formatEther(await deployer.getBalance()), "ETH");
  
  // Deploy the contract
  console.log("Deploying contract...");
  const matrixDice = await MatrixDiceSimple.deploy();
  
  // Wait for deployment
  await matrixDice.deployed();
  
  console.log("✅ MatrixDiceSimple deployed to:", matrixDice.address);
  console.log("Transaction hash:", matrixDice.deployTransaction.hash);
  
  // Wait for a few confirmations
  console.log("Waiting for 2 confirmations...");
  await matrixDice.deployTransaction.wait(2);
  
  // Test basic functionality
  console.log("\n🧪 Testing basic contract functions...");
  
  try {
    const jackpotPool = await matrixDice.getJackpotPool();
    console.log("Initial jackpot pool:", ethers.utils.formatEther(jackpotPool), "ETH");
    
    const playerBalance = await matrixDice.getPlayerBalance(deployer.address);
    console.log("Player balance:", ethers.utils.formatEther(playerBalance), "ETH");
    
    console.log("✅ Basic functions working correctly");
  } catch (error) {
    console.log("❌ Error testing functions:", error.message);
  }
  
  // Save deployment info
  const deploymentInfo = {
    contractAddress: matrixDice.address,
    network: "g7-testnet",
    chainId: 13746,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    transactionHash: matrixDice.deployTransaction.hash,
    gasUsed: matrixDice.deployTransaction.gasUsed?.toString(),
  };
  
  const fs = require("fs");
  const path = require("path");
  
  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  // Save deployment info
  fs.writeFileSync(
    path.join(deploymentsDir, "matrix-dice-g7-testnet.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("\n🎉 DEPLOYMENT COMPLETE!");
  console.log("=====================================");
  console.log("Contract Address:", matrixDice.address);
  console.log("Network: Game7 Testnet");
  console.log("Chain ID: 13746");
  console.log("Explorer: https://testnet-explorer.game7.io");
  console.log("Deployer:", deployer.address);
  console.log("Gas Used:", matrixDice.deployTransaction.gasUsed?.toString() || "Unknown");
  console.log("\n📁 Deployment info saved to: deployments/matrix-dice-g7-testnet.json");
  
  console.log("\n🎮 NEXT STEPS:");
  console.log("1. Update your .env file:");
  console.log(`   VITE_MATRIX_DICE_G7_TESTNET=${matrixDice.address}`);
  console.log("2. Test the contract on Game7 Explorer");
  console.log("3. Try the Matrix Dice game in your frontend!");
  
  return matrixDice;
}

// Run the deployment
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Deployment failed:", error);
      process.exit(1);
    });
}

module.exports = { main }; 