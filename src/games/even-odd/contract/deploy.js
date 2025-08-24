import pkg from "hardhat";
const { ethers } = pkg;

async function main() {
  console.log("Deploying EvenOdd contract to Xai Testnet v2...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Get account balance
  const balance = await deployer.getBalance();
  console.log("Account balance:", ethers.utils.formatEther(balance), "sXAI");

  // Deploy the contract
  const EvenOdd = await ethers.getContractFactory("EvenOdd");
  const evenOdd = await EvenOdd.deploy();

  console.log("Waiting for deployment...");
  await evenOdd.deployed();

  console.log("EvenOdd contract deployed!");
  console.log("Contract address:", evenOdd.address);
  console.log("Transaction hash:", evenOdd.deployTransaction.hash);
  console.log("Block number:", evenOdd.deployTransaction.blockNumber);

  // Fund the contract with initial balance for payouts
  console.log("\nFunding contract with initial balance...");
  const fundTx = await deployer.sendTransaction({
    to: evenOdd.address,
    value: ethers.utils.parseEther("0.01") // 0.01 sXAI
  });
  await fundTx.wait();
  console.log("Contract funded with 0.01 sXAI");

  // Verify contract constants
  const betAmount = await evenOdd.BET_AMOUNT();
  const winPayout = await evenOdd.WIN_PAYOUT();
  console.log("\nContract Constants:");
  console.log("Bet amount:", betAmount.toString(), "WEI");
  console.log("Win payout:", winPayout.toString(), "WEI");

  console.log("\nDeployment complete!");
  console.log("Contract address:", evenOdd.address);
  console.log("Explorer:", `https://sepolia.xaiscan.io/address/${evenOdd.address}`);
  console.log("Faucet:", "https://faucet.quicknode.com/xai");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 