import pkg from "hardhat";
const { ethers } = pkg;
import dotenv from "dotenv";

// Load .env from project root
dotenv.config({ path: "../../../../.env" });

const DEPLOYED_CONTRACT_ADDRESS = "0x6aEEccD5eB7f9bABA25F052d0608CC4E162786B8";
const DEPLOYMENT_KEY = process.env.DEPLOYMENT_KEY;

async function main() {
  console.log("Funding contract for payout testing...");
  
  const ownerWallet = new ethers.Wallet(DEPLOYMENT_KEY, ethers.provider);
  console.log("Owner wallet:", ownerWallet.address);
  
  const ownerBalance = await ethers.provider.getBalance(ownerWallet.address);
  console.log("Owner balance:", ethers.utils.formatEther(ownerBalance), "ETH");
  
  const contractBalance = await ethers.provider.getBalance(DEPLOYED_CONTRACT_ADDRESS);
  console.log("Contract balance before:", ethers.utils.formatEther(contractBalance), "ETH");
  
  // Send some ETH to the contract for payouts
  const fundAmount = ethers.utils.parseEther("0.01"); // 0.01 ETH should be enough for many games
  
  console.log("Sending", ethers.utils.formatEther(fundAmount), "ETH to contract...");
  
  const fundTx = await ownerWallet.sendTransaction({
    to: DEPLOYED_CONTRACT_ADDRESS,
    value: fundAmount,
    gasLimit: 100000
  });
  
  console.log("Funding transaction:", fundTx.hash);
  await fundTx.wait();
  
  const newContractBalance = await ethers.provider.getBalance(DEPLOYED_CONTRACT_ADDRESS);
  console.log("Contract balance after:", ethers.utils.formatEther(newContractBalance), "ETH");
  
  console.log("✅ Contract funded successfully!");
}

main().catch(console.error); 