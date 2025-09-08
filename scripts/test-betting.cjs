const { ethers } = require('ethers');
require('dotenv').config();

async function main() {
  console.log("🎲 Testing EvenOdd Betting System...");
  
  // Contract address from deployment
  const CONTRACT_ADDRESS = "0xEf506F17e839fc646Ff61605E640e4C78D38ffCF";
  
  // Setup provider and wallet
  const provider = new ethers.providers.JsonRpcProvider("https://testnet-v2.xai-chain.net/rpc");
  const privateKey = process.env.DEPLOYMENT_KEY;
  
  if (!privateKey) {
    throw new Error("DEPLOYMENT_KEY not found in environment variables");
  }
  
  const wallet = new ethers.Wallet(privateKey, provider);
  console.log("🎯 Test Player Address:", wallet.address);
  
  // Full contract ABI for testing
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
    console.log("\n📋 Contract Information:");
    console.log("Network: XAI Testnet v2");
    console.log("Contract Address:", CONTRACT_ADDRESS);
    console.log("Player Address:", wallet.address);
    
    // Get contract constants
    const betAmount = await evenOdd.BET_AMOUNT();
    const winPayout = await evenOdd.WIN_PAYOUT();
    
    console.log("\n💰 Game Constants:");
    console.log("- Bet Amount:", ethers.utils.formatEther(betAmount), "ETH");
    console.log("- Win Payout:", ethers.utils.formatEther(winPayout), "ETH");
    
    // Get current balances
    const playerBalance = await wallet.getBalance();
    const contractBalance = await provider.getBalance(CONTRACT_ADDRESS);
    
    console.log("\n💎 Current Balances:");
    console.log("- Player Balance:", ethers.utils.formatEther(playerBalance), "ETH");
    console.log("- Contract Balance:", ethers.utils.formatEther(contractBalance), "ETH");
    
    // Check current game status FIRST
    console.log("\n🎯 Checking Current Player Status...");
    const hasFreeSpin = await evenOdd.playerHasFreeSpin(wallet.address);
    const hasCommit = await evenOdd.hasCommit(wallet.address);
    const lastResult = await evenOdd.getLastResult(wallet.address);
    
    console.log("- Has Free Spin:", hasFreeSpin);
    console.log("- Has Pending Bet:", hasCommit);
    console.log("- Last Result:", lastResult);
    
    // Handle existing game state before proceeding
    if (hasCommit) {
      console.log("\n⏳ Player has a pending bet. Revealing it first...");
      try {
        const revealTx = await evenOdd.revealBet();
        console.log("✅ Reveal transaction sent:", revealTx.hash);
        
        console.log("⏳ Waiting for reveal confirmation...");
        const revealReceipt = await revealTx.wait();
        console.log("✅ Reveal confirmed in block:", revealReceipt.blockNumber);
        
        // Check status after reveal
        const resultAfterReveal = await evenOdd.getLastResult(wallet.address);
        const newFreeSpin = await evenOdd.playerHasFreeSpin(wallet.address);
        const newCommit = await evenOdd.hasCommit(wallet.address);
        
        console.log("📊 Result after reveal:", resultAfterReveal);
        console.log("🎁 Free spin available:", newFreeSpin);
        console.log("📝 Pending bet:", newCommit);
        
        // Wait for state update
        await new Promise(resolve => setTimeout(resolve, 5000));
        
      } catch (error) {
        console.log("❌ Bet reveal failed:", error.message);
      }
    }
    
    // Check if free spin is available and use it
    if (hasFreeSpin) {
      console.log("\n🎁 Player has a free spin. Using it first...");
      try {
        const freeSpinTx = await evenOdd.bet("even", { value: 0 });
        console.log("✅ Free spin bet transaction sent:", freeSpinTx.hash);
        
        console.log("⏳ Waiting for free spin confirmation...");
        const freeSpinReceipt = await freeSpinTx.wait();
        console.log("✅ Free spin confirmed in block:", freeSpinReceipt.blockNumber);
        
        // Check status after free spin
        const newFreeSpin = await evenOdd.playerHasFreeSpin(wallet.address);
        const newCommit = await evenOdd.hasCommit(wallet.address);
        console.log("🎁 Free spin available:", newFreeSpin);
        console.log("📝 Pending bet:", newCommit);
        
        // Wait for state update
        await new Promise(resolve => setTimeout(resolve, 5000));
        
      } catch (error) {
        console.log("❌ Free spin failed:", error.message);
      }
    }
    
    // Now check final status before proceeding with new tests
    console.log("\n🔍 Final Status Check Before New Tests:");
    const finalFreeSpinBeforeTest = await evenOdd.playerHasFreeSpin(wallet.address);
    const finalCommitBeforeTest = await evenOdd.hasCommit(wallet.address);
    
    console.log("- Free Spin Available:", finalFreeSpinBeforeTest);
    console.log("- Pending Bet:", finalCommitBeforeTest);
    
    if (finalCommitBeforeTest) {
      console.log("⚠️ Player still has pending bet.");
    }
    
    // Test betting flow
    console.log("\n🎲 Starting New Betting Test...");
    
    // Test 1: Place a bet on ODD
    console.log("\n📝 Test 1: Placing bet on ODD...");
    try {
      // Check if player has free spin first
      const hasFreeSpin = await evenOdd.playerHasFreeSpin(wallet.address);
      const betTx = await evenOdd.bet("odd", { value: hasFreeSpin ? 0 : betAmount });
      console.log("✅ Bet transaction sent:", betTx.hash, hasFreeSpin ? "(using free spin)" : "");
      
      console.log("⏳ Waiting for bet confirmation...");
      const betReceipt = await betTx.wait();
      console.log("✅ Bet confirmed in block:", betReceipt.blockNumber);
      
      // Check status after bet
      const hasFreeSpinAfterBet = await evenOdd.playerHasFreeSpin(wallet.address);
              const hasCommitAfterBet = await evenOdd.hasCommit(wallet.address);
      console.log("🎁 Free spin available:", hasFreeSpinAfterBet);
      console.log("📝 Pending bet:", hasCommitAfterBet);
      
    } catch (error) {
      console.log("❌ Bet placement failed:", error.message);
    }
    
    // Wait a bit for block confirmation
    console.log("\n⏳ Waiting 10 seconds for block confirmation...");
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Test 2: Reveal the bet
    console.log("\n🔓 Test 2: Revealing bet...");
    
    // Keep trying to reveal while player has pending bet
    while (await evenOdd.hasCommit(wallet.address)) {
      try {
        const revealTx = await evenOdd.revealBet();
        console.log("✅ Reveal transaction sent:", revealTx.hash);
        
        console.log("⏳ Waiting for reveal confirmation...");
        const revealReceipt = await revealTx.wait();
        console.log("✅ Reveal confirmed in block:", revealReceipt.blockNumber);
        
        // Check result after reveal
        const resultAfterReveal = await evenOdd.getLastResult(wallet.address);
        const newFreeSpin = await evenOdd.playerHasFreeSpin(wallet.address);
        const newCommit = await evenOdd.hasCommit(wallet.address);
        
        console.log("📊 Result after reveal:", resultAfterReveal);
        console.log("🎁 Free spin available:", newFreeSpin);
        console.log("📝 Pending bet:", newCommit);
        
        // Wait 10 seconds before next attempt
        await new Promise(resolve => setTimeout(resolve, 10000));
        
      } catch (error) {
        console.log("❌ Bet reveal failed:", error.message);
        // Wait 10 seconds before next attempt
        console.log("⏳ Waiting 10 seconds before next attempt...");
        await new Promise(resolve => setTimeout(resolve, 10000));
        continue;
      }
    }
    
    // Wait for final confirmation
    console.log("\n⏳ Waiting 5 seconds for final confirmation...");
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Test 3: Check final state
    console.log("\n🔍 Test 3: Checking final state...");
    try {
      const finalFreeSpin = await evenOdd.playerHasFreeSpin(wallet.address);
              const finalCommit = await evenOdd.hasCommit(wallet.address);
      const finalResult = await evenOdd.getLastResult(wallet.address);
      
      console.log("🎁 Final free spin status:", finalFreeSpin);
      console.log("📝 Final pending bet:", finalCommit);
      console.log("📊 Final result:", finalResult);
      
    } catch (error) {
      console.log("❌ Final state check failed:", error.message);
    }
    
    // Test 4: Try free spin if available
    const finalFreeSpinCheck = await evenOdd.playerHasFreeSpin(wallet.address);
    if (finalFreeSpinCheck) {
      console.log("\n🎁 Test 4: Testing free spin...");
      try {
        const freeSpinTx = await evenOdd.bet("even", { value: 0 });
        console.log("✅ Free spin bet transaction sent:", freeSpinTx.hash);
        
        console.log("⏳ Waiting for free spin confirmation...");
        const freeSpinReceipt = await freeSpinTx.wait();
        console.log("✅ Free spin confirmed in block:", freeSpinReceipt.blockNumber);
        
        // Check status after free spin
        const newFreeSpinAfterFreeSpin = await evenOdd.playerHasFreeSpin(wallet.address);
        const newCommitAfterFreeSpin = await evenOdd.hasCommit(wallet.address);
        console.log("🎁 Free spin available:", newFreeSpinAfterFreeSpin);
        console.log("📝 Pending bet:", newCommitAfterFreeSpin);
        
      } catch (error) {
        console.log("❌ Free spin failed:", error.message);
      }
    } else {
      console.log("\n🎁 Test 4: Skipping free spin test (not available)");
    }
    
    // Final balance check
    console.log("\n💎 Final Balance Check:");
    const finalPlayerBalance = await wallet.getBalance();
    const finalContractBalance = await provider.getBalance(CONTRACT_ADDRESS);
    
    console.log("- Final Player Balance:", ethers.utils.formatEther(finalPlayerBalance), "ETH");
    console.log("- Final Contract Balance:", ethers.utils.formatEther(finalContractBalance), "ETH");
    
    const balanceChange = finalPlayerBalance.sub(playerBalance);
    console.log("- Balance Change:", ethers.utils.formatEther(balanceChange), "ETH");
    
    console.log("\n✅ Betting test completed successfully!");
    console.log("🎉 Game mechanics working as expected!");
    
  } catch (error) {
    console.error("❌ Test betting failed:", error.message);
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