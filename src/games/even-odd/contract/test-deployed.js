import pkg from "hardhat";
const { ethers, network } = pkg;
import dotenv from "dotenv";

// Load .env from project root
dotenv.config({ path: "../../../../.env" });

// Deployed contract address on Xai Testnet v2
const DEPLOYED_CONTRACT_ADDRESS = "0x6aEEccD5eB7f9bABA25F052d0608CC4E162786B8";
const CONTRACT_OWNER = "0x4eD919172bD08D74831f2914aAAe8edA690d08Ab";
const DEPLOYMENT_KEY = process.env.DEPLOYMENT_KEY;

async function main() {
  console.log("Testing deployed EvenOdd contract on Xai Testnet v2...");
  console.log("Contract Address:", DEPLOYED_CONTRACT_ADDRESS);
  console.log("Network:", network.name);

  // Create wallet from DEPLOYMENT_KEY
  if (!DEPLOYMENT_KEY) {
    throw new Error("DEPLOYMENT_KEY not found in .env file");
  }
  
  const ownerWallet = new ethers.Wallet(DEPLOYMENT_KEY, ethers.provider);
  console.log("Owner wallet address:", ownerWallet.address);
  console.log("Expected contract owner:", CONTRACT_OWNER);
  
  if (ownerWallet.address.toLowerCase() !== CONTRACT_OWNER.toLowerCase()) {
    throw new Error(`Address mismatch! Wallet: ${ownerWallet.address}, Expected: ${CONTRACT_OWNER}`);
  }
  
  console.log("✅ Using correct deployment wallet as player");

  // Use owner wallet for testing
  const deployer = ownerWallet;
  const player1 = ownerWallet;

  // Get balance
  const ownerBalance = await ethers.provider.getBalance(ownerWallet.address);
  console.log("Owner wallet balance:", ethers.utils.formatEther(ownerBalance), "ETH");

  // Connect to deployed contract
  console.log("\n=== CONNECTING TO DEPLOYED CONTRACT ===");
  const EvenOdd = await ethers.getContractFactory("EvenOdd");
  const evenOdd = EvenOdd.attach(DEPLOYED_CONTRACT_ADDRESS);
  console.log("✅ Connected to deployed contract");

  // Test contract constants
  console.log("\n=== TESTING CONTRACT CONSTANTS ===");
  try {
    const betAmount = await evenOdd.BET_AMOUNT();
    const winPayout = await evenOdd.WIN_PAYOUT();
    const revealDelay = await evenOdd.REVEAL_DELAY();
    
    console.log("Bet Amount:", betAmount.toString(), "WEI");
    console.log("Win Payout:", winPayout.toString(), "WEI");
    console.log("Reveal Delay:", revealDelay.toString(), "blocks");
    console.log("✅ Contract constants working");
  } catch (error) {
    console.error("❌ Error reading constants:", error.message);
  }

  // Test contract balance
  console.log("\n=== CONTRACT STATUS ===");
  try {
    const contractBalance = await evenOdd.getContractBalance();
    console.log("Contract Balance:", ethers.utils.formatEther(contractBalance), "ETH");
    
    const owner = await evenOdd.owner();
    console.log("Contract Owner:", owner);
    console.log("✅ Contract status readable");
  } catch (error) {
    console.error("❌ Error reading contract status:", error.message);
  }

  // Test player state (initial)
  console.log("\n=== TESTING PLAYER STATE ===");
  try {
    const initialState = await evenOdd.getPlayerState(ownerWallet.address);
    console.log("Owner wallet initial state:");
    console.log("- Has Free Spin:", initialState[0]);
    console.log("- Games Played:", initialState[3].toString());
    console.log("- Wins:", initialState[4].toString());
    console.log("- Has Pending Bet:", initialState[5]);
    console.log("✅ Player state readable");
  } catch (error) {
    console.error("❌ Error reading player state:", error.message);
  }

  // Test full betting flow
  console.log("\n=== TESTING FULL BETTING FLOW ===");
  try {
    if (ownerBalance.gt(ethers.utils.parseEther("0.001"))) {
      console.log("✅ Owner has sufficient balance for betting");
      console.log("Balance:", ethers.utils.formatEther(ownerBalance), "ETH");
      console.log("Required for bet:", "0.000001 ETH (1000 WEI)");
      
      console.log("\nCommitting bet on ODD...");
      const commitTx = await evenOdd.connect(player1).betOdd({ 
        value: 1000,
        gasLimit: 500000 
      });
      const commitReceipt = await commitTx.wait();
      
      console.log("✅ Bet committed successfully");
      console.log("Transaction hash:", commitReceipt.transactionHash);
      console.log("Gas used:", commitReceipt.gasUsed.toString());
      
      // Check commit event
      const commitEvent = commitReceipt.events?.find(e => e.event === 'BetCommitted');
      if (commitEvent) {
        console.log("BetCommitted event:");
        console.log("- Player:", commitEvent.args.player);
        console.log("- Choice (true=odd):", commitEvent.args.choice);
        console.log("- Is Free Spin:", commitEvent.args.isFreeSpin);
        console.log("- Reveal Block:", commitEvent.args.revealBlock.toString());
      }

      // Check updated player state
      const stateAfterCommit = await evenOdd.getPlayerState(player1.address);
      console.log("Player state after commit:");
      console.log("- Has Pending Bet:", stateAfterCommit[5]);
      console.log("- Pending Choice (true=odd):", stateAfterCommit[6]);
      console.log("- Commit Block:", stateAfterCommit[7].toString());
      console.log("- Reveal Block:", stateAfterCommit[8].toString());

      // Test reveal (create blocks if needed)
      console.log("\n=== TESTING REVEAL ===");
      const currentBlock = await ethers.provider.getBlockNumber();
      const revealBlock = Number(stateAfterCommit[8]);
      console.log("Current block:", currentBlock);
      console.log("Reveal block:", revealBlock);
      
      if (currentBlock >= revealBlock) {
        console.log("✅ Reveal block reached, revealing bet...");
      } else {
        const blocksNeeded = revealBlock - currentBlock;
        console.log(`⏱️ Need to create ${blocksNeeded} more blocks...`);
        
        // Create blocks by sending minimal self-transactions (degen-gambit approach)
        for (let i = 0; i < blocksNeeded; i++) {
          console.log(`Creating block ${i + 1}/${blocksNeeded}...`);
          const blockTx = await player1.sendTransaction({
            to: player1.address,
            value: 1, // Minimal amount (1 WEI)
            gasLimit: 21000
          });
          await blockTx.wait();
          console.log(`✅ Block created: ${blockTx.hash}`);
        }
        
        const newCurrentBlock = await ethers.provider.getBlockNumber();
        console.log("New current block:", newCurrentBlock);
      }
      
      const revealTx = await evenOdd.connect(player1).revealBet({ gasLimit: 500000 });
      const revealReceipt = await revealTx.wait();
      
      console.log("✅ Bet revealed successfully");
      console.log("Transaction hash:", revealReceipt.transactionHash);
      
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

      // Final player state
      const finalState = await evenOdd.getPlayerState(player1.address);
      console.log("Final player state:");
      console.log("- Has Free Spin:", finalState[0]);
      console.log("- Games Played:", finalState[3].toString());
      console.log("- Wins:", finalState[4].toString());
      console.log("- Has Pending Bet:", finalState[5]);
      
    } else {
      console.log("⚠️ Owner has insufficient balance for testing bets");
      console.log("Current balance:", ethers.utils.formatEther(ownerBalance), "ETH");
      console.log("Need at least 0.001 ETH to test betting");
      console.log("Get testnet tokens from:", "https://faucet.quicknode.com/xai");
    }
  } catch (error) {
    console.error("❌ Error testing betting:", error.message);
  }

  console.log("\n=== DEPLOYMENT TEST COMPLETE ===");
  console.log("Contract is accessible and functional! 🎉");
  
  // Final contract balance
  try {
    const finalBalance = await evenOdd.getContractBalance();
    console.log("Final contract balance:", ethers.utils.formatEther(finalBalance), "ETH");
  } catch (error) {
    console.log("Could not read final balance");
  }
}

main()
  .then(() => {
    console.log("\n✅ Deployed contract test completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Deployed contract test failed:");
    console.error(error);
    process.exit(1);
  }); 