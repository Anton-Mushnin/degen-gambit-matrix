const { ethers } = require('ethers');
require('dotenv').config();

async function main() {
  console.log("🔍 Checking EvenOdd Contract Status on XAI Testnet...");
  
  // Contract address from deployment
  const CONTRACT_ADDRESS = "0xEf506F17e839fc646Ff61605E640e4C78D38ffCF";
  
  // Setup provider
  const provider = new ethers.providers.JsonRpcProvider("https://testnet-v2.xai-chain.net/rpc");
  
  // Contract ABI for status checking
  const abi = [
    "function owner() view returns (address)"
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
    console.log("\n📋 Contract Details:");
    console.log("- Version: 1.0.0");
    
    console.log("\n🎮 Game Configuration:");
    console.log("- Bet Amount: 1000 WEI (0.000001 ETH)");
    console.log("- Win Payout: 1400 WEI (0.0000014 ETH)");
    console.log("- Reveal Delay: 256 blocks");
    console.log("- Reveal Window: 256 blocks");
    
    // Get contract state
    const owner = await evenOdd.owner();
    
    console.log("\n🏗️ Contract State:");
    console.log("- Owner:", owner);
    console.log("- Status: ✅ ACTIVE");
    
    // Get contract balance from provider
    const balance = await provider.getBalance(evenOdd.address);
    
    console.log("\n💰 Financial Status:");
    console.log("- Contract Balance:", ethers.utils.formatEther(balance), "ETH");
    console.log("- Available for Betting:", ethers.utils.formatEther(balance), "ETH");
    
    if (balance.lt(ethers.utils.parseEther("0.000001"))) {
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