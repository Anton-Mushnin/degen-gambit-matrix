import pkg from "hardhat";
const { ethers } = pkg;
import dotenv from "dotenv";

// Load .env from project root
dotenv.config({ path: "../../../../.env" });

const DEPLOYED_CONTRACT_ADDRESS = "0x6aEEccD5eB7f9bABA25F052d0608CC4E162786B8";
const DEPLOYMENT_KEY = process.env.DEPLOYMENT_KEY;

async function main() {
  console.log("Checking current player state...");
  
  const ownerWallet = new ethers.Wallet(DEPLOYMENT_KEY, ethers.provider);
  console.log("Owner wallet:", ownerWallet.address);
  
  const EvenOdd = await ethers.getContractFactory("EvenOdd");
  const evenOdd = EvenOdd.attach(DEPLOYED_CONTRACT_ADDRESS);
  
  const state = await evenOdd.getPlayerState(ownerWallet.address);
  console.log("Current state:");
  console.log("- Has Free Spin:", state[0]);
  console.log("- Games Played:", state[3].toString());
  console.log("- Wins:", state[4].toString());
  console.log("- Has Pending Bet:", state[5]);
  
  if (state[5]) { // has pending bet
    console.log("- Pending Choice (true=odd):", state[6]);
    console.log("- Commit Block:", state[7].toString());
    console.log("- Reveal Block:", state[8].toString());
    
    const currentBlock = await ethers.provider.getBlockNumber();
    console.log("- Current Block:", currentBlock);
    
    if (currentBlock >= state[8]) {
      console.log("\n✅ Can reveal bet now! Revealing...");
      try {
        const revealTx = await evenOdd.connect(ownerWallet).revealBet({ gasLimit: 500000 });
        const receipt = await revealTx.wait();
        console.log("✅ Bet revealed successfully!");
        console.log("Transaction:", receipt.transactionHash);
        
        // Check events
        const resultEvent = receipt.events?.find(e => e.event === 'BetResult');
        if (resultEvent) {
          console.log("Result:");
          console.log("- Random Number:", resultEvent.args.number.toString());
          console.log("- Choice:", resultEvent.args.choice ? "ODD" : "EVEN");
          console.log("- Won:", resultEvent.args.won);
          console.log("- Payout:", resultEvent.args.payout.toString(), "WEI");
        }
      } catch (error) {
        console.error("❌ Error revealing:", error.message);
      }
    } else {
      console.log("⚠️ Need to wait", state[8] - currentBlock, "more blocks to reveal");
    }
  } else {
    console.log("✅ No pending bet - ready for new game!");
  }
}

main().catch(console.error); 