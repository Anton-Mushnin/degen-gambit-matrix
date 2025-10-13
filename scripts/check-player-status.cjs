const { ethers } = require('ethers');
require('dotenv').config();

async function main() {
  console.log("👤 Checking Player Status on EvenOdd Contract...");
  
  // Contract address from deployment
  const CONTRACT_ADDRESS = "0xEf506F17e839fc646Ff61605E640e4C78D38ffCF";
  
  // Setup provider and wallet
  const provider = new ethers.providers.JsonRpcProvider("https://testnet-v2.xai-chain.net/rpc");
  const privateKey = process.env.DEPLOYMENT_KEY;
  
  if (!privateKey) {
    throw new Error("DEPLOYMENT_KEY not found in environment variables");
  }
  
  const wallet = new ethers.Wallet(privateKey, provider);
  console.log("Player Address:", wallet.address);
  
  // Contract ABI for player status checking
  const abi = [
    "function playerHasFreeSpin(address) view returns (bool)",
    "function playerHasCommit(address) view returns (bool)",
    "function getLastResult(address) view returns (string)"
  ];
  
  // Get contract instance
  const evenOdd = new ethers.Contract(CONTRACT_ADDRESS, abi, wallet);
  
  try {
    console.log("\n📋 Player Information:");
    console.log("Network: XAI Testnet v2");
    console.log("Contract Address:", CONTRACT_ADDRESS);
    console.log("Player Address:", wallet.address);
    
    // Get current block
    const currentBlock = await provider.getBlockNumber();
    console.log("Current Block:", currentBlock);
    
    // Get player's game information
    const hasFreeSpin = await evenOdd.playerHasFreeSpin(wallet.address);
    const hasCommit = await evenOdd.playerHasCommit(wallet.address);
    const lastResult = await evenOdd.getLastResult(wallet.address);
    
    console.log("\n🎯 Current Game Status:");
    console.log("- Has Free Spin:", hasFreeSpin);
    console.log("- Has Active Commit:", hasCommit);
    console.log("- Last Result:", lastResult);
    
    if (!hasCommit) {
      console.log("❌ No active bet found");
      console.log("💡 You can place a new bet using:");
      console.log("   - bet(\"odd\") for ODD");
      console.log("   - bet(\"even\") for EVEN");
    } else {
      console.log("✅ Active bet found!");
      console.log("- Status: Ready to reveal");
      
      // Show potential outcomes
      console.log("\n💰 Potential Outcomes:");
      console.log("- If you win: 1400 WEI + FREE SPIN");
      console.log("- If you lose: 0 WEI");
    }
    
    // Get player's ETH balance
    const playerBalance = await wallet.getBalance();
    console.log("\n💎 Player Balance:");
    console.log("- ETH Balance:", ethers.utils.formatEther(playerBalance), "ETH");
    
    // Get contract balance from provider
    const contractBalance = await provider.getBalance(CONTRACT_ADDRESS);
    console.log("- Contract Balance:", ethers.utils.formatEther(contractBalance), "ETH");
    
    console.log("\n✅ Player status check completed!");
    
  } catch (error) {
    console.error("❌ Failed to check player status:", error.message);
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