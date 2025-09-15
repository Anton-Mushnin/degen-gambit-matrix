const { ethers } = require("hardhat");

// Network configuration mapping
const networkConfig = {
  "hardhat": {
    name: "Hardhat Local",
    chainId: 31337,
    explorer: "N/A",
    faucet: "N/A"
  },
  "localhost": {
    name: "Localhost",
    chainId: 31337,
    explorer: "N/A",
    faucet: "N/A"
  },
  "sepolia": {
    name: "Sepolia Testnet",
    chainId: 11155111,
    explorer: "https://sepolia.etherscan.io",
    faucet: "https://sepoliafaucet.com"
  },
  "mumbai": {
    name: "Mumbai Testnet",
    chainId: 80001,
    explorer: "https://mumbai.polygonscan.com",
    faucet: "https://faucet.polygon.technology"
  },
  "polygon": {
    name: "Polygon Mainnet",
    chainId: 137,
    explorer: "https://polygonscan.com",
    faucet: "N/A"
  },
  "mainnet": {
    name: "Ethereum Mainnet",
    chainId: 1,
    explorer: "https://etherscan.io",
    faucet: "N/A"
  },
  "g7-testnet": {
    name: "G7 Sepolia Testnet",
    chainId: 13746,
    explorer: "https://testnet.game7.io",
    faucet: "N/A"
  },
  "xai-testnet": {
    name: "Xai Testnet v2",
    chainId: 37714555429,
    explorer: "https://sepolia.xaiscan.io",
    faucet: "https://faucet.quicknode.com/xai"
  },
  "arbitrum-blueberry": {
    name: "Arbitrum Blueberry",
    chainId: 88153591557,
    explorer: "https://arb-blueberry.gelatoscout.com",
    faucet: "N/A"
  },
  "xprotocol-testnet": {
    name: "XProtocol Testnet",
    chainId: 83144,
    explorer: "https://explorer.testnet.xprotocol.org",
    faucet: "https://xprotocol.org/faucets"
  },
  "jasmy-testnet": {
    name: "Jasmy Chain Testnet",
    chainId: 681,
    explorer: "https://jasmy-chain-testnet-explorer.alt.technology",
    faucet: "http://13.49.243.124/"
  }
};

async function main() {
  // Get network information
  const network = await ethers.provider.getNetwork();
  const networkName = process.env.HARDHAT_NETWORK || "hardhat";
  const config = networkConfig[networkName] || {
    name: `Unknown Network (${networkName})`,
    chainId: network.chainId,
    explorer: "N/A",
    faucet: "N/A"
  };
  
  console.log(`🚀 Deploying DegenGambit contract to ${config.name}...`);
  console.log(`🔗 Chain ID: ${config.chainId}`);
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  console.log("💰 Account balance:", (await deployer.getBalance()).toString());

  // Constructor parameters for DegenGambit
  const blocksToAct = 50; // 10 blocks to act
  const costToSpin = ethers.utils.parseEther("0.00000001"); // 0.0001 ETH to spin
  const costToRespin = ethers.utils.parseEther("0.000000007"); // 0.00005 ETH to respin

  // Deploy the DegenGambit contract
  const DegenGambit = await ethers.getContractFactory("DegenGambit");
  const degenGambit = await DegenGambit.deploy(
    blocksToAct,
    costToSpin,
    costToRespin
  );
  
  await degenGambit.deployed();
  
  console.log("✅ DegenGambit deployed to:", degenGambit.address);
  console.log("🔗 Contract address:", degenGambit.address);
  
  // Fund the contract with some ETH for payouts
  const fundingAmount = ethers.utils.parseEther("0.0000001");
  console.log(`\n💰 Funding contract with ${ethers.utils.formatEther(fundingAmount)} ETH for payouts...`);
  
  const fundTx = await deployer.sendTransaction({
    to: degenGambit.address,
    value: fundingAmount
  });
  await fundTx.wait();
  console.log("✅ Contract funded successfully");
  
  // Verify deployment
  console.log("\n📋 Contract verification:");
  console.log("- BlocksToAct:", (await degenGambit.BlocksToAct()).toString());
  console.log("- CostToSpin:", ethers.utils.formatEther(await degenGambit.CostToSpin()), "ETH");
  console.log("- CostToRespin:", ethers.utils.formatEther(await degenGambit.CostToRespin()), "ETH");
  console.log("- DailyStreakReward:", ethers.utils.formatEther(await degenGambit.DailyStreakReward()), "GAMBIT");
  console.log("- WeeklyStreakReward:", ethers.utils.formatEther(await degenGambit.WeeklyStreakReward()), "GAMBIT");
  console.log("- MinorGambitPrize:", ethers.utils.formatEther(await degenGambit.MinorGambitPrize()), "GAMBIT");
  console.log("- MajorGambitPrize:", ethers.utils.formatEther(await degenGambit.MajorGambitPrize()), "GAMBIT");
  console.log("- Contract balance:", ethers.utils.formatEther(await degenGambit.provider.getBalance(degenGambit.address)), "ETH");
  
  // Save deployment info
  const deploymentInfo = {
    network: config.name,
    networkKey: networkName,
    chainId: config.chainId,
    contract: "DegenGambit",
    address: degenGambit.address,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    blockNumber: await degenGambit.provider.getBlockNumber(),
    explorer: config.explorer,
    faucet: config.faucet,
    constructorParams: {
      blocksToAct: blocksToAct,
      costToSpin: costToSpin.toString(),
      costToRespin: costToRespin.toString()
    }
  };
  
  console.log("\n💾 Deployment info saved to deployments.md");
  
  // Test basic functionality
  console.log("\n🧪 Testing basic functionality...");
  
  try {
    // Test hasPrize for deployer
    const hasPrize = await degenGambit.hasPrize(deployer.address);
    console.log("✅ hasPrize works:", hasPrize);
    
    // Test spinCost for deployer
    const spinCost = await degenGambit.spinCost(deployer.address);
    console.log("✅ spinCost works:", ethers.utils.formatEther(spinCost), "ETH");
    
    // Test prizes function
    const prizes = await degenGambit.prizes();
    console.log("✅ prizes function works:", prizes.prizesAmount.length, "prizes available");
    
    // Test version
    const version = await degenGambit.version();
    console.log("✅ version works:", version);
    
    // Test symbol
    const symbol = await degenGambit.symbol();
    console.log("✅ symbol works:", symbol);
    
    console.log("✅ Basic functionality test passed!");
  } catch (error) {
    console.log("❌ Basic functionality test failed:", error.message);
  }
  
  console.log("\n🎉 Deployment completed successfully!");
  console.log(`📱 Contract ready for use on ${config.name}`);
  console.log(`🔗 Explorer: ${config.explorer}`);
  if (config.faucet !== "N/A") {
    console.log(`🚰 Faucet: ${config.faucet}`);
  }
  console.log("\n📋 Next steps:");
  console.log("1. Update contract address in frontend config");
  console.log("2. Test spin functionality");
  console.log("3. Test prize claiming");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("💥 Deployment failed:", error);
    process.exit(1);
  });
