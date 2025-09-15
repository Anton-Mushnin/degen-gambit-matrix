const { ethers } = require('ethers');
require('dotenv').config();

async function main() {
  console.log("🎰 Testing DegenGambit Game Play on Xai Testnet v2...");
  
  // Contract address from XAI deployment
  const CONTRACT_ADDRESS = "0xD0303b8b13E2b0e98BFBc211F0DDE254c18E35f4";
  
  // Setup provider and wallet for Xai Testnet v2
  const provider = new ethers.providers.JsonRpcProvider("https://testnet-v2.xai-chain.net/rpc");
  const privateKey = process.env.DEPLOYMENT_KEY;
  
  if (!privateKey) {
    throw new Error("DEPLOYMENT_KEY not found in environment variables");
  }
  
  const wallet = new ethers.Wallet(privateKey, provider);
  console.log("🎯 Player Address:", wallet.address);
  
  // Contract ABI for playing
  const abi = [
    "function spin(bool boost) external payable",
    "function accept() external returns (uint256 left, uint256 center, uint256 right, uint256 remainingEntropy, uint256 prize)",
    "function acceptFor(address player) external returns (uint256 left, uint256 center, uint256 right, uint256 remainingEntropy, uint256 prize)",
    "function inspectOutcome(address degenerate) view returns (uint256 left, uint256 center, uint256 right, uint256 remainingEntropy, uint256 prize, uint256 typeOfPrize)",
    "function inspectEntropy(address degenerate) view returns (uint256)",
    "function hasPrize(address player) view returns (bool)",
    "function spinCost(address degenerate) view returns (uint256)",
    "function CurrentDailyStreakLength(address) view returns (uint256)",
    "function CurrentWeeklyStreakLength(address) view returns (uint256)",
    "function LastSpinBlock(address) view returns (uint256)",
    "function LastSpinBoosted(address) view returns (bool)",
    "function BlocksToAct() view returns (uint256)",
    "function CostToSpin() view returns (uint256)",
    "function CostToRespin() view returns (uint256)",
    "function symbol() view returns (string)",
    "function name() view returns (string)",
    "function balanceOf(address account) view returns (uint256)"
  ];
  
  // Get contract instance
  const degenGambit = new ethers.Contract(CONTRACT_ADDRESS, abi, wallet);

        // Get contract constants
        const blocksToAct = await degenGambit.BlocksToAct();
        const costToSpin = await degenGambit.CostToSpin();
        const costToRespin = await degenGambit.CostToRespin();
        const symbol = await degenGambit.symbol();
        const name = await degenGambit.name();
        
        console.log("\n💰 Game Constants:");
        console.log("- Name:", name);
        console.log("- Symbol:", symbol);
        console.log("- Blocks to Act:", blocksToAct.toString());
        console.log("- Cost to Spin:", ethers.utils.formatEther(costToSpin), "ETH");
        console.log("- Cost to Respin:", ethers.utils.formatEther(costToRespin), "ETH");
  
  // Main game loop
  let gameCount = 0;
  while (true) {
    try {
      gameCount++;
      console.log(`\n🎮 === GAME ROUND ${gameCount} ===`);
      

      
      // Check current status
      const hasPrize = await degenGambit.hasPrize(wallet.address);
      const spinCost = await degenGambit.spinCost(wallet.address);
      const dailyStreak = await degenGambit.CurrentDailyStreakLength(wallet.address);
      const weeklyStreak = await degenGambit.CurrentWeeklyStreakLength(wallet.address);
      const lastSpinBlock = await degenGambit.LastSpinBlock(wallet.address);
      const lastSpinBoosted = await degenGambit.LastSpinBoosted(wallet.address);
      const currentBlock = await provider.getBlockNumber();
      
      // Get player's contract token balance
      const playerBalance = await degenGambit.balanceOf(wallet.address);

      console.log("\n🎯 Current Status:");
      console.log("- Has Prize:", hasPrize);
      console.log("- Spin Cost:", ethers.utils.formatEther(spinCost), "ETH");
      console.log("- Daily Streak:", dailyStreak.toString());
      console.log("- Weekly Streak:", weeklyStreak.toString());
      console.log("- Last Spin Block:", lastSpinBlock.toString());
      console.log("- Last Spin Boosted:", lastSpinBoosted);
      console.log("- Current Block:", currentBlock.toString());
      console.log("- Player Token Balance:", ethers.utils.formatEther(playerBalance), symbol);
      
      // Check if player has a pending outcome to accept
      if (hasPrize) {
        console.log("\n🎁 Player has a prize to claim!");
        
        // Inspect the outcome first
        const outcome = await degenGambit.inspectOutcome(wallet.address);
        console.log("\n🔍 Inspecting Outcome:");
        console.log("- Left Reel:", outcome.left.toString());
        console.log("- Center Reel:", outcome.center.toString());
        console.log("- Right Reel:", outcome.right.toString());
        console.log("- Remaining Entropy:", outcome.remainingEntropy.toString());
        console.log("- Prize Amount:", ethers.utils.formatEther(outcome.prize), symbol);
        console.log("- Prize Type:", outcome.typeOfPrize.toString());
        
        // Accept the prize
        console.log("\n🎉 Accepting prize...");
        const acceptTx = await degenGambit.accept();
        console.log("✅ Accept transaction sent:", acceptTx.hash);
        
        console.log("⏳ Waiting for accept confirmation...");
        const acceptReceipt = await acceptTx.wait();
        console.log("✅ Accept confirmed in block:", acceptReceipt.blockNumber);
        
        console.log("\n🎯 Prize accepted successfully!");
        
        // Wait for state update
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
      
      // Always try to spin (removed block check)
      const boost = false;
      const actualCost = costToSpin;
      
      console.log(`\n🎰 Placing spin...`);
      console.log(`- Boost enabled: ${boost}`);
      console.log(`- Cost: ${ethers.utils.formatEther(actualCost)} ETH`);
      
      const spinTx = await degenGambit.spin(boost, { 
        value: actualCost 
      });
      console.log("✅ Spin transaction sent:", spinTx.hash);
      
      console.log("⏳ Waiting for spin confirmation...");
      const spinReceipt = await spinTx.wait();
      console.log("✅ Spin confirmed in block:", spinReceipt.blockNumber);
      
      console.log("\n🎯 Spin placed successfully!");
      console.log("💡 Wait for the required blocks to pass, then call accept() to claim your prize");
      
      // Loop until inspectOutcome succeeds
      let outcome;
      while (true) {
        try {
          outcome = await degenGambit.inspectOutcome(wallet.address);
          break;
        } catch (err) {
          console.log("⏳ Outcome not ready yet, waiting...");
          // Send 1 WEI (native token) from wallet.address to walettt.address
          const waletttAddress = wallet.address; // replace with actual address if needed
          try {
            const tx = await wallet.sendTransaction({
              to: waletttAddress,
              value: ethers.BigNumber.from("1")
            });
            console.log(`Sent 1 WEI from ${wallet.address} to ${waletttAddress}. Tx: ${tx.hash}`);
            await tx.wait();
            console.log("WEI transfer confirmed.");
          } catch (transferErr) {
            console.log("Failed to send 1 WEI:", transferErr.message);
          }
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      console.log("🔍 Outcome after spin:");
      console.log("- Left Reel:", outcome.left.toString());
      console.log("- Center Reel:", outcome.center.toString());
      console.log("- Right Reel:", outcome.right.toString());
      console.log("- Remaining Entropy:", outcome.remainingEntropy.toString());
      console.log("- Prize Amount:", ethers.utils.formatEther(outcome.prize), symbol);
      console.log("- Prize Type:", outcome.typeOfPrize.toString());
      
      console.log(`\n✅ Game round ${gameCount} completed!`);
      console.log("🔄 Starting next round in 5 seconds...");
      await new Promise(resolve => setTimeout(resolve, 5000));
      
    } catch (error) {
      console.error(`❌ Game round ${gameCount} failed:`, error.message);
      if (error.code === 'NETWORK_ERROR') {
        console.error("Network connection failed. Check RPC endpoint.");
      }
      console.log("🔄 Retrying in 10 seconds...");
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("💥 Script execution failed:", error);
    process.exit(1);
  });
