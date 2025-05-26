import pkg from 'hardhat';
const { ethers, network, run } = pkg;

async function main() {
  // Check for required environment variables
  if (!process.env.DEPLOYMENT_KEY) {
    throw new Error("DEPLOYMENT_KEY is required in .env file");
  }

  // Get the fee collector address from environment
  if (!process.env.FEE_COLLECTOR_ADDRESS) {
    throw new Error("FEE_COLLECTOR_ADDRESS is required in .env file");
  }
  const feeCollector = process.env.FEE_COLLECTOR_ADDRESS;

  // Get network info
  console.log(`Deploying to network: ${network.name} (${network.config.chainId})`);

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying RockPaperScissors contract with the account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());
  console.log("Fee collector address:", feeCollector);

  // Get current gas price
  const gasPrice = await ethers.provider.getFeeData();
  console.log("Current gas price:", gasPrice.gasPrice?.toString() || "unknown");

  // Deploy the contract with gas settings
  console.log("Deploying contract...");
  const RockPaperScissors = await ethers.getContractFactory("RockPaperScissors");
  const rps = await RockPaperScissors.deploy(feeCollector, {
    gasLimit: 5000000, // Set a reasonable gas limit
  });

  console.log("Waiting for deployment transaction...");
  const deployTx = await rps.deploymentTransaction();
  console.log("Deployment transaction hash:", deployTx.hash);

  await rps.waitForDeployment();
  
  const contractAddress = await rps.getAddress();
  console.log("RockPaperScissors deployed to:", contractAddress);
  
  // Wait for more block confirmations on mainnet
  const confirmations = network.config.chainId === 1 ? 5 : 2; // 5 for mainnet, 2 for others
  console.log(`Waiting for ${confirmations} block confirmations...`);
  await deployTx.wait(confirmations);
  
  // Verify contract on Etherscan
  if (process.env.ETHERSCAN_API_KEY) {
    console.log("Verifying contract on Etherscan...");
    try {
      await run("verify:verify", {
        address: contractAddress,
        constructorArguments: [feeCollector],
        contract: "contracts/RPS/rps.sol:RockPaperScissors"
      });
      console.log("Contract verified on Etherscan");
    } catch (error) {
      if (error.message.includes("Already Verified")) {
        console.log("Contract is already verified");
      } else {
        console.error("Error verifying contract:", error.message);
      }
    }
  } else {
    console.log("Skipping verification - ETHERSCAN_API_KEY not set");
  }

  // Print deployment summary
  console.log("\nDeployment Summary:");
  console.log("-------------------");
  console.log("Network:", network.name);
  console.log("Contract Address:", contractAddress);
  console.log("Deployer:", deployer.address);
  console.log("Fee Collector:", feeCollector);
  console.log("Transaction Hash:", deployTx.hash);
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\nDeployment failed!");
    console.error("Error:", error.message);
    process.exit(1);
  }); 