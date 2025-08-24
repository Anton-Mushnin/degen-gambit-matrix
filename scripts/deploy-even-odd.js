import pkg from "hardhat";
const { ethers } = pkg;

async function main() {
  console.log("Deploying EvenOdd contract to Xai Testnet v2...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Get account balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.utils.formatEther(balance), "ETH");

  // Deploy EvenOdd contract
  console.log("\nDeploying EvenOdd contract...");
  const EvenOdd = await ethers.getContractFactory("EvenOdd");
  const evenOdd = await EvenOdd.deploy();
  
  await evenOdd.deployed();
  const contractAddress = evenOdd.address;
  
  console.log("✅ EvenOdd contract deployed to:", contractAddress);

  // Fund the contract with initial balance for payouts
  console.log("\nFunding contract with 0.01 ETH for payouts...");
  const fundTx = await deployer.sendTransaction({
    to: contractAddress,
    value: ethers.utils.parseEther("0.01")
  });
  await fundTx.wait();
  console.log("✅ Contract funded successfully");

  // Verify contract constants
  const betAmount = await evenOdd.BET_AMOUNT();
  const winPayout = await evenOdd.WIN_PAYOUT();
  const revealDelay = await evenOdd.REVEAL_DELAY();
  
  console.log("\n=== Contract Configuration ===");
  console.log("Bet Amount:", betAmount.toString(), "WEI");
  console.log("Win Payout:", winPayout.toString(), "WEI"); 
  console.log("Reveal Delay:", revealDelay.toString(), "blocks");
  
  const contractBalance = await ethers.provider.getBalance(contractAddress);
  console.log("Contract Balance:", ethers.utils.formatEther(contractBalance), "ETH");

  console.log("\n=== Deployment Summary ===");
  console.log("Network: Xai Testnet v2");
  console.log("Contract Address:", contractAddress);
  console.log("Deployer:", deployer.address);
  console.log("Transaction Hash:", evenOdd.deployTransaction.hash);
  
  return {
    contractAddress,
    deployer: deployer.address,
    network: "xai-testnet"
  };
}

main()
  .then((result) => {
    console.log("\n🎉 Deployment completed successfully!");
    console.log("Save this contract address:", result.contractAddress);
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  }); 