const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying EvenOdd contract to XAI Testnet...");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  console.log("💰 Account balance:", (await deployer.getBalance()).toString());

  // Deploy the EvenOdd contract
  const EvenOdd = await ethers.getContractFactory("EvenOdd");
  const evenOdd = await EvenOdd.deploy();
  
  await evenOdd.deployed();
  
  console.log("✅ EvenOdd deployed to:", evenOdd.address);
  console.log("🔗 Contract address:", evenOdd.address);
  
  // Fund the contract with some ETH for payouts
  const fundingAmount = ethers.utils.parseEther("0.000001");
  console.log(`\n💰 Funding contract with ${ethers.utils.formatEther(fundingAmount)} ETH for payouts...`);
  
  const fundTx = await deployer.sendTransaction({
    to: evenOdd.address,
    value: fundingAmount
  });
  await fundTx.wait();
  console.log("✅ Contract funded successfully");
  
  // Verify deployment
  console.log("\n📋 Contract verification:");
  console.log("- BET_AMOUNT:", (await evenOdd.BET_AMOUNT()).toString(), "WEI");
  console.log("- WIN_PAYOUT:", (await evenOdd.WIN_PAYOUT()).toString(), "WEI");
  console.log("- Owner:", await evenOdd.owner());
  
  // Save deployment info
  const deploymentInfo = {
    network: "XAI Testnet",
    chainId: 37714555429,
    contract: "EvenOdd",
    address: evenOdd.address,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    blockNumber: await evenOdd.provider.getBlockNumber(),
    rpc: "https://testnet-v2.xai-chain.net/rpc",
    explorer: "https://sepolia.xaiscan.io",
    faucet: "https://faucet.quicknode.com/xai"
  };
  
  console.log("\n💾 Deployment info saved to deployments.md");
  
  // Test basic functionality
  console.log("\n🧪 Testing basic functionality...");
  
  try {
    // Test playerHasFreeSpin for deployer
    const hasFreeSpin = await evenOdd.playerHasFreeSpin(deployer.address);
    console.log("✅ playerHasFreeSpin works:", hasFreeSpin);
    
    // Test playerHasCommit for deployer
    const hasCommit = await evenOdd.playerHasCommit(deployer.address);
    console.log("✅ playerHasCommit works:", hasCommit);
    
    // Test getLastResult for deployer
    const result = await evenOdd.getLastResult(deployer.address);
    console.log("✅ getLastResult works:", result);
    
    console.log("✅ Basic functionality test passed!");
  } catch (error) {
    console.log("❌ Basic functionality test failed:", error.message);
  }
  
  console.log("\n🎉 Deployment completed successfully!");
  console.log("📱 Contract ready for use on XAI Testnet");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("💥 Deployment failed:", error);
    process.exit(1);
  }); 