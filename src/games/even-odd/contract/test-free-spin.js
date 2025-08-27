import pkg from "hardhat";
const { ethers } = pkg;
import dotenv from "dotenv";

// Load .env from project root
dotenv.config({ path: "../../../../.env" });

const DEPLOYED_CONTRACT_ADDRESS = "0x6aEEccD5eB7f9bABA25F052d0608CC4E162786B8";
const DEPLOYMENT_KEY = process.env.DEPLOYMENT_KEY;

async function main() {
  console.log("Testing free spin functionality...");
  
  const ownerWallet = new ethers.Wallet(DEPLOYMENT_KEY, ethers.provider);
  console.log("Owner wallet:", ownerWallet.address);
  
  const EvenOdd = await ethers.getContractFactory("EvenOdd");
  const evenOdd = EvenOdd.attach(DEPLOYED_CONTRACT_ADDRESS);
  
  const state = await evenOdd.getPlayerState(ownerWallet.address);
  console.log("Current state:");
  console.log("- Has Free Spin:", state[0]);
  console.log("- Free Spin Choice (true=odd):", state[1]);
  console.log("- Games Played:", state[3].toString());
  console.log("- Wins:", state[4].toString());
  console.log("- Has Pending Bet:", state[5]);
  
  if (state[0]) { // has free spin
    console.log("\n✅ Player has free spin! Using it...");
    
    try {
      // Use free spin - call placeBet without payment
      const choice = state[1]; // use the free spin choice
      console.log("Free spin choice:", choice ? "ODD" : "EVEN");
      
      const freeSpinTx = await evenOdd.connect(ownerWallet).placeBet(choice, { gasLimit: 500000 });
      const receipt = await freeSpinTx.wait();
      
      console.log("✅ Free spin committed successfully!");
      console.log("Transaction:", receipt.transactionHash);
      
      // Check commit event
      const commitEvent = receipt.events?.find(e => e.event === 'BetCommitted');
      if (commitEvent) {
        console.log("BetCommitted event:");
        console.log("- Player:", commitEvent.args.player);
        console.log("- Choice (true=odd):", commitEvent.args.choice);
        console.log("- Is Free Spin:", commitEvent.args.isFreeSpin);
        console.log("- Reveal Block:", commitEvent.args.revealBlock.toString());
      }
      
      // Now wait and reveal
      const newState = await evenOdd.getPlayerState(ownerWallet.address);
      const currentBlock = await ethers.provider.getBlockNumber();
      const revealBlock = Number(newState[8]);
      
      console.log("\n=== CREATING BLOCKS FOR REVEAL ===");
      console.log("Current block:", currentBlock);
      console.log("Reveal block:", revealBlock);
      
      if (currentBlock < revealBlock) {
        const blocksNeeded = revealBlock - currentBlock;
        console.log(`Creating ${blocksNeeded} blocks...`);
        
        for (let i = 0; i < blocksNeeded; i++) {
          console.log(`Creating block ${i + 1}/${blocksNeeded}...`);
          const blockTx = await ownerWallet.sendTransaction({
            to: ownerWallet.address,
            value: 1,
            gasLimit: 21000
          });
          await blockTx.wait();
        }
      }
      
      console.log("\n=== REVEALING FREE SPIN ===");
      const revealTx = await evenOdd.connect(ownerWallet).revealBet({ gasLimit: 500000 });
      const revealReceipt = await revealTx.wait();
      
      console.log("✅ Free spin revealed successfully!");
      
      const resultEvent = revealReceipt.events?.find(e => e.event === 'BetResult');
      if (resultEvent) {
        console.log("Result:");
        console.log("- Random Number:", resultEvent.args.number.toString());
        console.log("- Choice:", resultEvent.args.choice ? "ODD" : "EVEN");
        console.log("- Won:", resultEvent.args.won);
        console.log("- Payout:", resultEvent.args.payout.toString(), "WEI");
        console.log("- Earned Free Spin:", resultEvent.args.earnedFreeSpin);
      }
      
    } catch (error) {
      console.error("❌ Error with free spin:", error.message);
    }
  } else {
    console.log("⚠️ No free spin available");
  }
}

main().catch(console.error); 