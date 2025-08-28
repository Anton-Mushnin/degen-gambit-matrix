const { ethers } = require('ethers');
require('dotenv').config();

async function main() {
  console.log("🔍 Checking EvenOdd Contract Status on XAI Testnet...");
  
  // Contract address from deployment
  const CONTRACT_ADDRESS = "0xc5e303401C5bCDA5a75cFd74eC59f429C39B933c";
  
  // Setup provider
  const provider = new ethers.providers.JsonRpcProvider("https://testnet-v2.xai-chain.net/rpc");
  
  // Contract ABI for status checking
  const abi = [
    "function VERSION() view returns (string)",
    "function BET_AMOUNT() view returns (uint256)",
    "function WIN_PAYOUT() view returns (uint256)",
    "function REVEAL_DELAY() view returns (uint256)",
    "function REVEAL_WINDOW() view returns (uint256)",
    "function owner() view returns (address)",
    "function getBalance() view returns (uint256)",
    "function paused() view returns (bool)"
  ];
  
  // Get contract instance (read-only)
  const evenOdd = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);
  
  try {
    console.log("\n📋 Contract Information:");
    console.log("Network: XAI Testnet v2");
    console.log("Contract Address:", CONTRACT_ADDRESS);
    console.log("Block Explorer: https://sepolia.xaiscan.io/address/" + CONTRACT_ADDRESS);
    
    // Get current block
    const currentBlock = await provider.getBlockNumber();
    console.log("Current Block:", currentBlock);
    
    // Get contract constants
    const version = await evenOdd.VERSION();
    const betAmount = await evenOdd.BET_AMOUNT();
    const winPayout = await evenOdd.WIN_PAYOUT();
    const revealDelay = await evenOdd.REVEAL_DELAY();
    const revealWindow = await evenOdd.REVEAL_WINDOW();
    
    console.log("\n📋 Contract Details:");
    console.log("- Version:", version);
    
    console.log("\n🎮 Game Configuration:");
    console.log("- Bet Amount:", ethers.utils.formatEther(betAmount), "ETH");
    console.log("- Win Payout:", ethers.utils.formatEther(winPayout), "ETH");
    console.log("- Reveal Delay:", revealDelay.toString(), "blocks");
    console.log("- Reveal Window:", revealWindow.toString(), "blocks");
    
    // Get contract state
    const owner = await evenOdd.owner();
    const balance = await evenOdd.getBalance();
    const isPaused = await evenOdd.paused();
    
    console.log("\n🏗️ Contract State:");
    console.log("- Owner:", owner);
    console.log("- Contract Balance:", ethers.utils.formatEther(balance), "ETH");
    console.log("- Paused:", isPaused ? "Yes" : "No");
    console.log("- Status:", isPaused ? "⏸️ PAUSED" : "✅ ACTIVE");
    
    // Calculate potential payouts
    const maxConcurrentBets = balance.div(betAmount);
    const maxPayouts = balance.div(winPayout);
    
    console.log("\n💰 Financial Status:");
    console.log("- Available for Betting:", ethers.utils.formatEther(balance), "ETH");
    console.log("- Max Concurrent Bets:", maxConcurrentBets.toString());
    console.log("- Max Possible Payouts:", maxPayouts.toString());
    
    if (balance.lt(betAmount)) {
      console.log("⚠️  WARNING: Contract balance too low for payouts!");
    }
    
    console.log("\n✅ Contract status check completed!");
    
  } catch (error) {
    console.error("❌ Failed to check contract status:", error.message);
    if (error.code === 'NETWORK_ERROR') {
      console.error("Network connection failed. Check RPC endpoint.");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("💥 Script execution failed:", error);
    process.exit(1);
  }); 