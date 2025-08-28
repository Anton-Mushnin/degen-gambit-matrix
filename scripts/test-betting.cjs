const { ethers } = require('ethers');
require('dotenv').config();

async function main() {
  console.log("🎲 Testing EvenOdd Betting Flow on XAI Testnet...");
  
  // Contract address from deployment
  const CONTRACT_ADDRESS = "0xc5e303401C5bCDA5a75cFd74eC59f429C39B933c";
  
  // Setup provider and wallet
  const provider = new ethers.providers.JsonRpcProvider("https://testnet-v2.xai-chain.net/rpc");
  const privateKey = process.env.DEPLOYMENT_KEY;
  
  if (!privateKey) {
    throw new Error("DEPLOYMENT_KEY not found in environment variables");
  }
  
  const wallet = new ethers.Wallet(privateKey, provider);
  console.log("Player Address:", wallet.address);
  
  // Contract ABI for betting operations
  const abi = [
    "function BET_AMOUNT() view returns (uint256)",
    "function WIN_PAYOUT() view returns (uint256)",
    "function REVEAL_DELAY() view returns (uint256)",
    "function REVEAL_WINDOW() view returns (uint256)",
    "function betOdd() payable",
    "function betEven() payable",
    "function revealBet()",
    "function getPlayerBet(address) view returns (bool,uint256,uint256,bool,bool,bool,bool)",
    "function getBalance() view returns (uint256)"
  ];
  
  // Get contract instance
  const evenOdd = new ethers.Contract(CONTRACT_ADDRESS, abi, wallet);
  
  try {
    console.log("\n📋 Betting Test Information:");
    console.log("Network: XAI Testnet v2");
    console.log("Contract Address:", CONTRACT_ADDRESS);
    console.log("Player Address:", wallet.address);
    
    // Get current block and contract info
    const currentBlock = await provider.getBlockNumber();
    const betAmount = await evenOdd.BET_AMOUNT();
    const winPayout = await evenOdd.WIN_PAYOUT();
    const revealDelay = await evenOdd.REVEAL_DELAY();
    
    console.log("Current Block:", currentBlock);
    console.log("Bet Amount:", ethers.utils.formatEther(betAmount), "ETH");
    console.log("Win Payout:", ethers.utils.formatEther(winPayout), "ETH");
    console.log("Reveal Delay:", revealDelay.toString(), "blocks");
    
    // Check current player status
    console.log("\n🔍 Checking current player status...");
    const betRevealed = await checkBetStatus(evenOdd, wallet.address, "Current status", wallet);
    
    if (betRevealed) {
      console.log("✅ Bet was revealed! Script completed.");
      return;
    }
    
    // Check if there's an active bet that's not ready for reveal
    const currentBet = await evenOdd.getPlayerBet(wallet.address);
    if (currentBet[1].gt(0)) {
      console.log("⏳ Bet not ready for reveal yet. Cannot proceed with new bet.");
      console.log("💡 Run this script again after waiting for the reveal delay!");
      return;
    }
    
    // Place a new bet
    console.log("\n🎯 Placing new bet on ODD...");
    console.log(`Betting ${ethers.utils.formatEther(betAmount)} ETH on ODD`);
    
    const betTx = await evenOdd.betOdd({ value: betAmount });
    console.log("Transaction sent, waiting for confirmation...");
    console.log("Transaction hash:", betTx.hash);
    
    const betReceipt = await betTx.wait();
    console.log("✅ Bet placed successfully in block:", betReceipt.blockNumber);
    
    // Wait for reveal delay
    console.log(`\n⏳ Waiting for reveal delay (${revealDelay} blocks)...`);
    console.log("Current block:", betReceipt.blockNumber);
    console.log("Target block for reveal:", betReceipt.blockNumber + revealDelay.toNumber());
    
    // Check bet status after placement
    await checkBetStatus(evenOdd, wallet.address, "After bet placement", wallet);
    
    console.log("\n💡 To reveal your bet, run this script again after waiting for the reveal delay!");
    console.log("Or wait for the blocks to pass and then call revealBet() manually.");
    
  } catch (error) {
    console.error("❌ Betting test failed:", error.message);
    if (error.stack) {
      console.error("Stack trace:", error.stack);
    }
  }
}

async function revealBet(evenOdd, wallet) {
  try {
    console.log("\n🎲 Revealing bet...");
    
    const revealTx = await evenOdd.revealBet();
    console.log("Reveal transaction sent, waiting for confirmation...");
    console.log("Transaction hash:", revealTx.hash);
    
    const revealReceipt = await revealTx.wait();
    console.log("✅ Bet revealed successfully in block:", revealReceipt.blockNumber);
    
    // Check for events
    if (revealReceipt.events) {
      const betRevealedEvent = revealReceipt.events.find(e => e.event === 'BetRevealed');
      if (betRevealedEvent) {
        console.log("\n🎉 Bet Result:");
        console.log("- Random number:", betRevealedEvent.args.number.toString());
        console.log("- Number is odd:", betRevealedEvent.args.isOdd);
        console.log("- You won:", betRevealedEvent.args.won ? "Yes! 🎊" : "No 😔");
        console.log("- Payout:", ethers.utils.formatEther(betRevealedEvent.args.payout), "ETH");
        
        if (betRevealedEvent.args.won) {
          console.log("🎁 FREE SPIN awarded! You can bet again with the same choice!");
        }
      }
    }
    
    // Check new bet status
    await checkBetStatus(evenOdd, wallet.address, "After reveal", wallet);
    
  } catch (error) {
    console.error("❌ Reveal failed:", error.message);
  }
}

async function checkBetStatus(evenOdd, playerAddress, context, wallet) {
  try {
    console.log(`\n📊 Bet Status (${context}):`);
    
    const bet = await evenOdd.getPlayerBet(playerAddress);
    
    if (bet[1].eq(0)) {
      console.log("❌ No active bet");
      return false;
    }
    
    console.log("- Choice:", bet[0] ? "ODD" : "EVEN");
    console.log("- Bet Block:", bet[1].toString());
    console.log("- Amount:", ethers.utils.formatEther(bet[2]), "ETH");
    console.log("- Free Spin:", bet[3] ? "Yes" : "No");
    console.log("- Revealed:", bet[4] ? "Yes" : "No");
    console.log("- Can Reveal:", bet[5] ? "Yes" : "No");
    console.log("- Expired:", bet[6] ? "Yes" : "No");
    
    if (bet[5]) {
      console.log("🎉 Ready to reveal! Automatically revealing...");
      await revealBet(evenOdd, wallet);
      return true;
    } else if (bet[6]) {
      console.log("⌛ Bet has expired!");
      return false;
    } else {
      console.log("⏳ Waiting for reveal delay...");
      return false;
    }
    
  } catch (error) {
    console.error("❌ Failed to check bet status:", error.message);
    return false;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("💥 Script execution failed:", error);
    process.exit(1);
  }); 