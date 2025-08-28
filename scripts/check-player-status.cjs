const { ethers } = require('ethers');
require('dotenv').config();

async function main() {
  console.log("👤 Checking Player Status on EvenOdd Contract...");
  
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
  
  // Contract ABI for player status checking
  const abi = [
    "function BET_AMOUNT() view returns (uint256)",
    "function REVEAL_DELAY() view returns (uint256)",
    "function REVEAL_WINDOW() view returns (uint256)",
    "function getPlayerBet(address) view returns (bool,uint256,uint256,bool,bool,bool,bool)",
    "function getBalance() view returns (uint256)"
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
    
    // Get player's bet information
    const playerBet = await evenOdd.getPlayerBet(wallet.address);
    
    // Parse bet data
    const isOdd = playerBet[0];
    const betBlockNumber = playerBet[1];
    const betAmount = playerBet[2];
    const isFreeSpin = playerBet[3];
    const isRevealed = playerBet[4];
    const canReveal = playerBet[5];
    const isExpired = playerBet[6];
    
    console.log("\n🎯 Current Bet Status:");
    
    if (betBlockNumber.eq(0)) {
      console.log("❌ No active bet found");
      console.log("💡 You can place a new bet using:");
      console.log("   - betOdd() for ODD");
      console.log("   - betEven() for EVEN");
    } else {
      console.log("✅ Active bet found!");
      console.log("- Choice:", isOdd ? "ODD" : "EVEN");
      console.log("- Bet Amount:", ethers.utils.formatEther(betAmount), "ETH");
      console.log("- Bet Block:", betBlockNumber.toString());
      console.log("- Free Spin:", isFreeSpin ? "Yes" : "No");
      console.log("- Revealed:", isRevealed ? "Yes" : "No");
      console.log("- Can Reveal:", canReveal ? "Yes" : "No");
      console.log("- Expired:", isExpired ? "Yes" : "No");
      
      // Calculate timing information
      const blocksSinceBet = currentBlock.sub(betBlockNumber);
      const revealDelay = await evenOdd.REVEAL_DELAY();
      const revealWindow = await evenOdd.REVEAL_WINDOW();
      
      console.log("\n⏰ Timing Information:");
      console.log("- Blocks since bet:", blocksSinceBet.toString());
      console.log("- Blocks until reveal:", Math.max(0, revealDelay.sub(blocksSinceBet).toNumber()));
      console.log("- Blocks until expiry:", Math.max(0, revealDelay.add(revealWindow).sub(blocksSinceBet).toNumber()));
      
      if (canReveal) {
        console.log("🎉 Ready to reveal! Call revealBet() to get your result!");
      } else if (blocksSinceBet.lt(revealDelay)) {
        const blocksToWait = revealDelay.sub(blocksSinceBet);
        console.log("⏳ Waiting for reveal delay...");
        console.log(`   ${blocksToWait.toString()} more blocks needed`);
      } else if (isExpired) {
        console.log("⌛ Bet has expired! You can place a new bet.");
      }
      
      // Show potential outcomes
      if (!isRevealed) {
        const betAmountEth = ethers.utils.formatEther(betAmount);
        const winPayout = await evenOdd.BET_AMOUNT().mul(14).div(10); // 1.4x payout
        const winPayoutEth = ethers.utils.formatEther(winPayout);
        
        console.log("\n💰 Potential Outcomes:");
        console.log("- If you win:", winPayoutEth, "ETH + FREE SPIN");
        console.log("- If you lose:", "0 ETH");
        console.log("- Current bet:", betAmountEth, "ETH");
      }
    }
    
    // Get player's ETH balance
    const playerBalance = await wallet.getBalance();
    console.log("\n💎 Player Balance:");
    console.log("- ETH Balance:", ethers.utils.formatEther(playerBalance), "ETH");
    
    // Get contract balance
    const contractBalance = await evenOdd.getBalance();
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