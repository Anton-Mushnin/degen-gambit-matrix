import pkg from "hardhat";
const { ethers } = pkg;
import dotenv from "dotenv";

// Load .env from project root
dotenv.config({ path: "../../../../.env" });

const DEPLOYED_CONTRACT_ADDRESS = "0x6aEEccD5eB7f9bABA25F052d0608CC4E162786B8";
const DEPLOYMENT_KEY = process.env.DEPLOYMENT_KEY;

async function main() {
  console.log("Testing fresh game flow (complete cycle)...");
  
  const ownerWallet = new ethers.Wallet(DEPLOYMENT_KEY, ethers.provider);
  console.log("Owner wallet:", ownerWallet.address);
  
  // Create a temporary wallet for testing (fresh state)
  const tempWallet = ethers.Wallet.createRandom().connect(ethers.provider);
  console.log("Temp test wallet:", tempWallet.address);
  
  // Send some ETH to temp wallet for testing
  console.log("Funding temp wallet...");
  const fundTx = await ownerWallet.sendTransaction({
    to: tempWallet.address,
    value: ethers.utils.parseEther("0.001"), // Small amount for testing
    gasLimit: 100000
  });
  await fundTx.wait();
  console.log("✅ Temp wallet funded");
  
  const EvenOdd = await ethers.getContractFactory("EvenOdd");
  const evenOdd = EvenOdd.attach(DEPLOYED_CONTRACT_ADDRESS);
  
  // Check temp wallet initial state
  const initialState = await evenOdd.getPlayerState(tempWallet.address);
  console.log("\nTemp wallet initial state:");
  console.log("- Has Free Spin:", initialState[0]);
  console.log("- Games Played:", initialState[3].toString());
  console.log("- Wins:", initialState[4].toString());
  console.log("- Has Pending Bet:", initialState[5]);
  
  if (initialState[5]) {
    console.log("❌ Temp wallet already has pending bet - something's wrong!");
    return;
  }
  
  console.log("\n=== STEP 1: COMMITTING BET ===");
  const commitTx = await evenOdd.connect(tempWallet).betOdd({ 
    value: 1000,
    gasLimit: 500000 
  });
  const commitReceipt = await commitTx.wait();
  
  console.log("✅ Bet committed successfully!");
  console.log("Transaction:", commitReceipt.transactionHash);
  
  // Check commit event
  const commitEvent = commitReceipt.events?.find(e => e.event === 'BetCommitted');
  if (commitEvent) {
    console.log("BetCommitted event:");
    console.log("- Player:", commitEvent.args.player);
    console.log("- Choice (true=odd):", commitEvent.args.choice);
    console.log("- Is Free Spin:", commitEvent.args.isFreeSpin);
    console.log("- Reveal Block:", commitEvent.args.revealBlock.toString());
  }
  
  // Get updated state
  const stateAfterCommit = await evenOdd.getPlayerState(tempWallet.address);
  const currentBlock = await ethers.provider.getBlockNumber();
  const revealBlock = Number(stateAfterCommit[8]);
  
  console.log("\n=== STEP 2: CREATING BLOCKS FOR REVEAL ===");
  console.log("Current block:", currentBlock);
  console.log("Reveal block:", revealBlock);
  
  if (currentBlock < revealBlock) {
    const blocksNeeded = revealBlock - currentBlock;
    console.log(`Creating ${blocksNeeded} blocks using degen-gambit approach...`);
    
    for (let i = 0; i < blocksNeeded; i++) {
      console.log(`Creating block ${i + 1}/${blocksNeeded}...`);
      const blockTx = await ownerWallet.sendTransaction({
        to: ownerWallet.address,
        value: 1, // Minimal amount (1 WEI)
        gasLimit: 100000
      });
      await blockTx.wait();
    }
    
    const newCurrentBlock = await ethers.provider.getBlockNumber();
    console.log("New current block:", newCurrentBlock);
  }
  
  console.log("\n=== STEP 3: REVEALING BET ===");
  const revealTx = await evenOdd.connect(tempWallet).revealBet({ gasLimit: 500000 });
  const revealReceipt = await revealTx.wait();
  
  console.log("✅ Bet revealed successfully!");
  console.log("Transaction:", revealReceipt.transactionHash);
  
  // Check result event
  const resultEvent = revealReceipt.events?.find(e => e.event === 'BetResult');
  if (resultEvent) {
    console.log("BetResult event:");
    console.log("- Random Number:", resultEvent.args.number.toString());
    console.log("- Choice:", resultEvent.args.choice ? "ODD" : "EVEN");
    console.log("- Won:", resultEvent.args.won);
    console.log("- Payout:", resultEvent.args.payout.toString(), "WEI");
    console.log("- Earned Free Spin:", resultEvent.args.earnedFreeSpin);
  }
  
  // Final state
  const finalState = await evenOdd.getPlayerState(tempWallet.address);
  console.log("\n=== FINAL STATE ===");
  console.log("- Has Free Spin:", finalState[0]);
  console.log("- Games Played:", finalState[3].toString());
  console.log("- Wins:", finalState[4].toString());
  console.log("- Has Pending Bet:", finalState[5]);
  
  const finalBalance = await ethers.provider.getBalance(tempWallet.address);
  console.log("Final temp wallet balance:", ethers.utils.formatEther(finalBalance), "ETH");
  
  console.log("\n🎉 COMPLETE GAME CYCLE TESTED SUCCESSFULLY!");
}

main().catch(console.error); 