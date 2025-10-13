const { ethers } = require('ethers');
require('dotenv').config();

async function main() {
  console.log("🔍 Testing EvenOdd Commit Status Monitoring...");
  
  // Contract address from deployment
  const CONTRACT_ADDRESS = "0xbB3e7605247674758c1A61e40a967BC7b39b7CF8";
  
  // Setup provider and wallet
  const provider = new ethers.providers.JsonRpcProvider("https://testnet-v2.xai-chain.net/rpc");
  const privateKey = process.env.DEPLOYMENT_KEY;
  
  if (!privateKey) {
    throw new Error("DEPLOYMENT_KEY not found in environment variables");
  }
  
  const wallet = new ethers.Wallet(privateKey, provider);
  console.log("🎯 Test Player Address:", wallet.address);
  
  // Contract ABI for testing
  const abi = [
    "function bet(string) external payable",
    "function hasCommit(address) view returns (bool)",
    "function getCommitDetails(address) view returns (bytes32, uint256)",
    "function BET_AMOUNT() view returns (uint256)"
  ];
  
  // Get contract instance
  const evenOdd = new ethers.Contract(CONTRACT_ADDRESS, abi, wallet);
  
  try {
    console.log("\n📋 Contract Information:");
    console.log("Network: XAI Testnet v2");
    console.log("Contract Address:", CONTRACT_ADDRESS);
    console.log("Player Address:", wallet.address);
    
    // Get contract constants
    const betAmount = await evenOdd.BET_AMOUNT();
    console.log("\n💰 Game Constants:");
    console.log("- Bet Amount:", ethers.utils.formatEther(betAmount), "ETH");
    
    // Get current balances
    const playerBalance = await wallet.getBalance();
    const contractBalance = await provider.getBalance(CONTRACT_ADDRESS);
    
    console.log("\n💎 Current Balances:");
    console.log("- Player Balance:", ethers.utils.formatEther(playerBalance), "ETH");
    console.log("- Contract Balance:", ethers.utils.formatEther(contractBalance), "ETH");
    
    // Check initial commit status
    console.log("\n🎯 Initial Status Check...");
    const initialCommit = await evenOdd.hasCommit(wallet.address);
    console.log("- Has Commit:", initialCommit);
    
    if (initialCommit) {
      console.log("⚠️ Player already has a pending bet. Cannot proceed with new bet.");
      return;
    }
    
    // Place a bet
    console.log("\n🎲 Placing bet on ODD...");
    try {
      const betTx = await evenOdd.bet("odd", { value: betAmount });
      console.log("✅ Bet transaction sent:", betTx.hash);
      
      console.log("⏳ Waiting for bet confirmation...");
      const betReceipt = await betTx.wait();
      console.log("✅ Bet confirmed in block:", betReceipt.blockNumber);
      
      // Check commit status immediately after bet
      const commitAfterBet = await evenOdd.hasCommit(wallet.address);
      console.log("📝 Commit status after bet:", commitAfterBet);
      
      // Get commit details immediately after bet
      if (commitAfterBet) {
        try {
          const [committedHash, commitBlock] = await evenOdd.getCommitDetails(wallet.address);
          console.log("🔍 Initial commit details:");
          console.log("  - Committed Hash:", committedHash);
          console.log("  - Commit Block:", commitBlock);
          console.log("  - Current Block:", await provider.getBlockNumber());
        } catch (error) {
          console.log("❌ Error getting commit details:", error.message);
        }
      }
      
    } catch (error) {
      console.log("❌ Bet placement failed:", error.message);
    }
    
    // Start monitoring commit status every second
    console.log("\n🔍 Starting commit status monitoring (every second for 60 iterations)...");
    console.log("Time | Block | Has Commit | Status");
    console.log("-----|-------|------------|--------");
    
    let iteration = 0;
    const maxIterations = 60;
    
    const monitorInterval = setInterval(async () => {
      try {
        iteration++;
        
        // Get current block
        const currentBlock = await provider.getBlockNumber();
        
        // Check commit status
        const hasCommit = await evenOdd.hasCommit(wallet.address);
        
        // Get commit details if available
        let commitDetails = "N/A";
          try {
            const [committedHash, commitBlock] = await evenOdd.getCommitDetails(wallet.address);
            commitDetails = `Hash: ${committedHash.slice(0, 10)}...${committedHash.slice(-8)} | Block: ${commitBlock}`;
          } catch (error) {
            commitDetails = "Error getting details";
          }

        // Get current timestamp
        const now = new Date();
        const timeStr = now.toLocaleTimeString();
        
        // Display status
        const status = hasCommit ? "COMMITTED" : "NO COMMIT";
        console.log(`${timeStr} | ${currentBlock.toString().padStart(6)} | ${hasCommit.toString().padStart(10)} | ${status}`);
        

        console.log(`    └─ ${commitDetails}`);
        
        // Check if we've reached max iterations
        if (iteration >= maxIterations) {
          clearInterval(monitorInterval);
          console.log("\n✅ Monitoring completed!");
          
          // Final status check
          const finalCommit = await evenOdd.hasCommit(wallet.address);
          const finalBlock = await provider.getBlockNumber();
          console.log(`\n📊 Final Status:`);
          console.log(`- Block: ${finalBlock}`);
          console.log(`- Has Commit: ${finalCommit}`);
          
          if (finalCommit) {
            console.log("🎯 Player still has a committed bet ready for reveal");
            
            // Get final commit details
            try {
              const [finalHash, finalCommitBlock] = await evenOdd.getCommitDetails(wallet.address);
              console.log("🔍 Final commit details:");
              console.log("  - Committed Hash:", finalHash);
              console.log("  - Commit Block:", finalCommitBlock);
              console.log("  - Blocks since commit:", finalBlock - finalCommitBlock);
            } catch (error) {
              console.log("❌ Error getting final commit details:", error.message);
            }
          } else {
            console.log("❌ No committed bet found - something went wrong");
          }
        }
        
      } catch (error) {
        console.log(`❌ Error in iteration ${iteration}:`, error.message);
        clearInterval(monitorInterval);
      }
    }, 1000);
    
    // Wait for monitoring to complete
    await new Promise((resolve) => {
      setTimeout(resolve, (maxIterations + 1) * 1000);
    });
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    if (error.code === 'NETWORK_ERROR') {
      console.error("Network connection failed. Check RPC endpoint.");
    }
    if (error.code === 'INSUFFICIENT_FUNDS') {
      console.error("Insufficient funds for betting. Check wallet balance.");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("💥 Script execution failed:", error);
    process.exit(1);
  }); 