const { ethers } = require("hardhat");
const { verify } = require("../utils/verify");

// Network configurations for Chainlink VRF V2
const networkConfig = {
  // Ethereum Sepolia Testnet
  11155111: {
    name: "sepolia",
    vrfCoordinatorV2: "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625",
    gasLane: "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c",
    subscriptionId: "0", // You need to create this
    callbackGasLimit: "500000",
    mintFee: ethers.utils.parseEther("0.01"),
    blockConfirmations: 6,
  },
  // Polygon Mumbai Testnet
  80001: {
    name: "mumbai",
    vrfCoordinatorV2: "0x7a1BaC17Ccc5b313516C5E16fb24f7659aA5ebed",
    gasLane: "0x4b09e658ed251bcafeebbc69400383d49f344ace09b9576fe248bb02c003fe9f",
    subscriptionId: "0", // You need to create this
    callbackGasLimit: "500000",
    mintFee: ethers.utils.parseEther("0.01"),
    blockConfirmations: 6,
  },
  // Polygon Mainnet
  137: {
    name: "polygon",
    vrfCoordinatorV2: "0xAE975071Be8F8eE67addBC1A82488F1C24858067",
    gasLane: "0xcc294a196eeeb44da2888d17c0625cc88d70d9760a69d58d853ba6581a9ab0cd",
    subscriptionId: "0", // You need to create this
    callbackGasLimit: "500000",
    mintFee: ethers.utils.parseEther("0.01"),
    blockConfirmations: 6,
  },
  // Ethereum Mainnet
  1: {
    name: "mainnet",
    vrfCoordinatorV2: "0x271682DEB8C4E0901D1a1550aD2e64D568E69909",
    gasLane: "0x8af398995b04c28e9951adb9721ef74c74f93e6a478f39e7e0777be13527e7ef",
    subscriptionId: "0", // You need to create this
    callbackGasLimit: "500000",
    mintFee: ethers.utils.parseEther("0.01"),
    blockConfirmations: 6,
  },
  // G7 Testnet (Custom network)
  13746: {
    name: "g7-testnet",
    vrfCoordinatorV2: "0x0000000000000000000000000000000000000000", // Not available
    gasLane: "0x0000000000000000000000000000000000000000000000000000000000000000",
    subscriptionId: "0",
    callbackGasLimit: "500000",
    mintFee: ethers.utils.parseEther("0.01"),
    blockConfirmations: 1,
  },
  // Local development
  31337: {
    name: "localhost",
    vrfCoordinatorV2: "0x0000000000000000000000000000000000000000", // Mock contract
    gasLane: "0x0000000000000000000000000000000000000000000000000000000000000000",
    subscriptionId: "1",
    callbackGasLimit: "500000",
    mintFee: ethers.utils.parseEther("0.01"),
    blockConfirmations: 1,
  }
};

async function deployMatrixDice() {
  const [deployer] = await ethers.getSigners();
  const chainId = await deployer.getChainId();
  
  console.log("Deploying MatrixDice with account:", deployer.address);
  console.log("Account balance:", ethers.utils.formatEther(await deployer.getBalance()));
  console.log("Chain ID:", chainId);

  // Get network configuration
  const config = networkConfig[chainId];
  if (!config) {
    throw new Error(`No configuration found for chain ID ${chainId}`);
  }

  console.log(`Deploying to ${config.name} network`);

  // For localhost/development, deploy mock VRF coordinator
  let vrfCoordinatorAddress = config.vrfCoordinatorV2;
  let subscriptionId = config.subscriptionId;

  if (chainId === 31337 || chainId === 13746) {
    console.log("Deploying mock VRF Coordinator for development...");
    
    // Deploy mock VRF Coordinator
    const VRFCoordinatorV2Mock = await ethers.getContractFactory("VRFCoordinatorV2Mock");
    const vrfCoordinatorMock = await VRFCoordinatorV2Mock.deploy(
      ethers.utils.parseEther("0.1"), // baseFee
      ethers.utils.parseEther("0.000000001") // gasPriceLink
    );
    await vrfCoordinatorMock.deployed();
    
    vrfCoordinatorAddress = vrfCoordinatorMock.address;
    console.log("Mock VRF Coordinator deployed to:", vrfCoordinatorAddress);

    // Create subscription for development
    const tx = await vrfCoordinatorMock.createSubscription();
    const receipt = await tx.wait();
    subscriptionId = receipt.events[0].args.subId;
    console.log("Created subscription ID:", subscriptionId.toString());

    // Fund the subscription
    await vrfCoordinatorMock.fundSubscription(subscriptionId, ethers.utils.parseEther("10"));
    console.log("Funded subscription with 10 LINK");
  }

  // Deploy MatrixDice contract
  const MatrixDice = await ethers.getContractFactory("MatrixDice");
  
  console.log("Deploying MatrixDice contract...");
  console.log("VRF Coordinator:", vrfCoordinatorAddress);
  console.log("Subscription ID:", subscriptionId.toString());
  console.log("Gas Lane:", config.gasLane);
  console.log("Callback Gas Limit:", config.callbackGasLimit);

  const matrixDice = await MatrixDice.deploy(
    vrfCoordinatorAddress,
    subscriptionId,
    config.gasLane,
    config.callbackGasLimit
  );

  await matrixDice.deployed();
  console.log("MatrixDice deployed to:", matrixDice.address);

  // Add contract as consumer to VRF subscription
  if (chainId === 31337 || chainId === 13746) {
    const vrfCoordinator = await ethers.getContractAt("VRFCoordinatorV2Mock", vrfCoordinatorAddress);
    await vrfCoordinator.addConsumer(subscriptionId, matrixDice.address);
    console.log("Added MatrixDice as VRF consumer");
  } else {
    console.log("⚠️  IMPORTANT: Add this contract as a consumer to your VRF subscription:");
    console.log("   Contract Address:", matrixDice.address);
    console.log("   Subscription ID:", subscriptionId.toString());
    console.log("   VRF Coordinator:", vrfCoordinatorAddress);
  }

  // Wait for block confirmations before verification
  if (chainId !== 31337 && config.blockConfirmations > 1) {
    console.log(`Waiting for ${config.blockConfirmations} block confirmations...`);
    await matrixDice.deployTransaction.wait(config.blockConfirmations);
  }

  // Verify contract on Etherscan (if not localhost)
  if (chainId !== 31337 && process.env.ETHERSCAN_API_KEY) {
    console.log("Verifying contract on Etherscan...");
    try {
      await verify(matrixDice.address, [
        vrfCoordinatorAddress,
        subscriptionId,
        config.gasLane,
        config.callbackGasLimit,
      ]);
      console.log("Contract verified successfully");
    } catch (error) {
      console.log("Verification failed:", error.message);
    }
  }

  // Display deployment summary
  console.log("\n🎲 MATRIX DICE DEPLOYMENT SUMMARY");
  console.log("=====================================");
  console.log("Contract Address:", matrixDice.address);
  console.log("Network:", config.name);
  console.log("Chain ID:", chainId);
  console.log("VRF Coordinator:", vrfCoordinatorAddress);
  console.log("Subscription ID:", subscriptionId.toString());
  console.log("Deployer:", deployer.address);
  console.log("Gas Used:", matrixDice.deployTransaction.gasUsed?.toString() || "Unknown");
  
  if (chainId !== 31337 && chainId !== 13746) {
    console.log("\n⚠️  POST-DEPLOYMENT STEPS:");
    console.log("1. Fund your VRF subscription with LINK tokens");
    console.log("2. Add this contract as a consumer to your subscription");
    console.log("3. Update your frontend configuration with the contract address");
    console.log("4. Test the contract functions");
  }

  // Save deployment info
  const deploymentInfo = {
    contractAddress: matrixDice.address,
    network: config.name,
    chainId: chainId,
    vrfCoordinator: vrfCoordinatorAddress,
    subscriptionId: subscriptionId.toString(),
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
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
    path.join(deploymentsDir, `matrix-dice-${config.name}.json`),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log(`\nDeployment info saved to: deployments/matrix-dice-${config.name}.json`);
  
  return matrixDice;
}

// Allow script to be run directly
if (require.main === module) {
  deployMatrixDice()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { deployMatrixDice }; 