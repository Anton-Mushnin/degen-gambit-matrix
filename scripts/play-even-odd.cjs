const { ethers } = require('ethers');
require('dotenv').config();

async function main() {
  console.log("🎲 Quick EvenOdd Game Play on XProtocol Testnet...");
  
  // Contract address from XProtocol deployment
  const CONTRACT_ADDRESS = "0x2180FD757Cb7855153De4d7288E4Df2c31D38753";
  
  // Setup provider and wallet for XProtocol Testnet
  const provider = new ethers.providers.JsonRpcProvider("https://rpc.testnet.xprotocol.org");
  const privateKey = process.env.DEPLOYMENT_KEY;
  
  if (!privateKey) {
    throw new Error("DEPLOYMENT_KEY not found in environment variables");
  }
  
  const wallet = new ethers.Wallet(privateKey, provider);
  console.log("🎯 Player Address:", wallet.address);
  
  // Contract ABI for playing
  const abi = [
    "function bet(string) external payable",
    "function revealBet() external",
    "function getLastResult(address) view returns (string)",
    "function playerHasFreeSpin(address) view returns (bool)",
    "function hasCommit(address) view returns (bool)",
    "function BET_AMOUNT() view returns (uint256)",
    "function WIN_PAYOUT() view returns (uint256)"
  ];
  
  // Get contract instance
  const evenOdd = new ethers.Contract(CONTRACT_ADDRESS, abi, wallet);
  
  try {
    console.log("\n📋 Game Information:");
    console.log("Network: XProtocol Testnet");
    console.log("Contract Address:", CONTRACT_ADDRESS);
    console.log("Explorer: https://explorer.testnet.xprotocol.org/address/" + CONTRACT_ADDRESS);
    
    // Get contract constants
    const betAmount = await evenOdd.BET_AMOUNT();
    const winPayout = await evenOdd.WIN_PAYOUT();
    
    console.log("\n💰 Game Constants:");
    console.log("- Bet Amount:", ethers.utils.formatEther(betAmount), "ETH");
    console.log("- Win Payout:", ethers.utils.formatEther(winPayout), "ETH");
    
    // Check current status
    const hasFreeSpin = await evenOdd.playerHasFreeSpin(wallet.address);
    const hasCommit = await evenOdd.hasCommit(wallet.address);
    const lastResult = await evenOdd.getLastResult(wallet.address);
    
    console.log("\n🎯 Current Status:");
    console.log("- Has Free Spin:", hasFreeSpin);
    console.log("- Has Pending Bet:", hasCommit);
    console.log("- Last Result:", lastResult);
    
    // If has pending bet, reveal it first
    if (hasCommit) {
      console.log("\n⏳ Revealing pending bet...");
      const revealTx = await evenOdd.revealBet();
      console.log("✅ Reveal transaction sent:", revealTx.hash);
      
      console.log("⏳ Waiting for reveal confirmation...");
      const revealReceipt = await revealTx.wait();
      console.log("✅ Reveal confirmed in block:", revealReceipt.blockNumber);
      
      // Check result
      const resultAfterReveal = await evenOdd.getLastResult(wallet.address);
      console.log("📊 Result:", resultAfterReveal);
      
      // Wait for state update
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    // Check if can place new bet
    const canBet = !(await evenOdd.hasCommit(wallet.address));
    
    if (canBet) {
      // Place a bet (use free spin if available)
      const currentFreeSpin = await evenOdd.playerHasFreeSpin(wallet.address);
      const choice = Math.random() > 0.5 ? "odd" : "even";
      
      console.log(`\n🎲 Placing bet on ${choice.toUpperCase()}...`);
      console.log(currentFreeSpin ? "🎁 Using FREE SPIN!" : "💰 Using regular bet");
      
      const betTx = await evenOdd.bet(choice, { 
        value: currentFreeSpin ? 0 : betAmount 
      });
      console.log("✅ Bet transaction sent:", betTx.hash);
      
      console.log("⏳ Waiting for bet confirmation...");
      const betReceipt = await betTx.wait();
      console.log("✅ Bet confirmed in block:", betReceipt.blockNumber);
      
      console.log("\n🎯 Bet placed successfully!");
      console.log("💡 Call revealBet() after a few blocks to see the result");
      
    } else {
      console.log("\n⚠️ Cannot place bet - player has pending bet");
      console.log("💡 Call revealBet() to reveal the current bet");
    }
    
    console.log("\n✅ Quick play completed!");
    
  } catch (error) {
    console.error("❌ Quick play failed:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("💥 Script execution failed:", error);
    process.exit(1);
  }); 