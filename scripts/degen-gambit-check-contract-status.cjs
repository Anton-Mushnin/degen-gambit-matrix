const { ethers } = require('ethers');
require('dotenv').config();

async function main() {
  console.log("🔍 Checking DegenGambit Contract Status on Xai Testnet v2...");
  
  // Contract address from XAI deployment
  const CONTRACT_ADDRESS = "0xE01c848c4b5e4Ac90746cd7bef27aEF23c9fcEa6";
  
  // Setup provider for Xai Testnet v2
  const provider = new ethers.providers.JsonRpcProvider("https://testnet-v2.xai-chain.net/rpc");

  const THIRDWEB_ACCOUNT_ADDRESS = "0xc1779c548C15CA7706e3a04D3573d491DD8900f9";
  
  // Contract ABI for status checking
  const abi = [
    "function version() view returns (string)",
    "function symbol() view returns (string)",
    "function name() view returns (string)",
    "function totalSupply() view returns (uint256)",
    "function BlocksToAct() view returns (uint256)",
    "function CostToSpin() view returns (uint256)",
    "function CostToRespin() view returns (uint256)",
    "function DailyStreakReward() view returns (uint256)",
    "function WeeklyStreakReward() view returns (uint256)",
    "function MinorGambitPrize() view returns (uint256)",
    "function MajorGambitPrize() view returns (uint256)",
    "function prizes() view returns (uint256[] prizesAmount, uint256[] typeOfPrize)",
    "function hasPrize(address player) view returns (bool)",
    "function spinCost(address degenerate) view returns (uint256)",
    "function CurrentDailyStreakLength(address) view returns (uint256)",
    "function CurrentWeeklyStreakLength(address) view returns (uint256)",
    "function LastSpinBlock(address) view returns (uint256)",
    "function LastSpinBoosted(address) view returns (bool)"
  ];
  
  // Get contract instance (read-only)
  const degenGambit = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);
  
  try {
    console.log("\n📋 Contract Information:");
    console.log("Network: Xai Testnet v2");
    console.log("Contract Address:", CONTRACT_ADDRESS);
    console.log("Block Explorer: https://testnet-explorer-v2.xai-chain.net/address/" + CONTRACT_ADDRESS);
    
    // Get current block
    const currentBlock = await provider.getBlockNumber();
    console.log("Current Block:", currentBlock);
    
    // Get contract constants
    console.log("\n📋 Contract Details:");
    const version = await degenGambit.version();
    const symbol = await degenGambit.symbol();
    const name = await degenGambit.name();
    const totalSupply = await degenGambit.totalSupply();
    
    console.log("- Version:", version);
    console.log("- Name:", name);
    console.log("- Symbol:", symbol);
    console.log("- Total Supply:", ethers.utils.formatEther(totalSupply), symbol);
    
    console.log("\n🎮 Game Configuration:");
    const blocksToAct = await degenGambit.BlocksToAct();
    const costToSpin = await degenGambit.CostToSpin();
    const costToRespin = await degenGambit.CostToRespin();
    const dailyStreakReward = await degenGambit.DailyStreakReward();
    const weeklyStreakReward = await degenGambit.WeeklyStreakReward();
    const minorGambitPrize = await degenGambit.MinorGambitPrize();
    const majorGambitPrize = await degenGambit.MajorGambitPrize();
    
    console.log("- Blocks to Act:", blocksToAct.toString());
    console.log("- Cost to Spin:", ethers.utils.formatEther(costToSpin), "ETH");
    console.log("- Cost to Respin:", ethers.utils.formatEther(costToRespin), "ETH");
    console.log("- Daily Streak Reward:", ethers.utils.formatEther(dailyStreakReward), symbol);
    console.log("- Weekly Streak Reward:", ethers.utils.formatEther(weeklyStreakReward), symbol);
    console.log("- Minor Gambit Prize:", ethers.utils.formatEther(minorGambitPrize), symbol);
    console.log("- Major Gambit Prize:", ethers.utils.formatEther(majorGambitPrize), symbol);
    
    // Get prizes information
    const prizes = await degenGambit.prizes();
    console.log("\n🎁 Available Prizes:");
    console.log("- Total Prize Types:", prizes.typeOfPrize.length);
    console.log("- Prize Amounts:", prizes.prizesAmount.length);
    
    // Get contract balance from provider
    const balance = await provider.getBalance(degenGambit.address);
    
    console.log("\n💰 Financial Status:");
    console.log("- Contract Balance:", ethers.utils.formatEther(balance), "ETH");
    console.log("- Available for Payouts:", ethers.utils.formatEther(balance), "ETH");
    
    if (balance.lt(ethers.utils.parseEther("0.000001"))) {
      console.log("⚠️  WARNING: Contract balance too low for payouts!");
    }
    
    // Test basic functionality with a sample address
    console.log("\n🧪 Testing Basic Functionality:");

    
    // const testAddress = process.env.TEST_ADDRESS;
    const testAddress = THIRDWEB_ACCOUNT_ADDRESS;

    if (!testAddress) {
      throw new Error("TEST_ADDRESS not found in environment variables");
    }
    try {
      console.log("🎯 Testing with address:", testAddress);
      const hasPrize = await degenGambit.hasPrize(testAddress);
      const spinCost = await degenGambit.spinCost(testAddress);
      const dailyStreak = await degenGambit.CurrentDailyStreakLength(testAddress);
      const weeklyStreak = await degenGambit.CurrentWeeklyStreakLength(testAddress);
      const lastSpinBlock = await degenGambit.LastSpinBlock(testAddress);
      const lastSpinBoosted = await degenGambit.LastSpinBoosted(testAddress);
      
      console.log("✅ hasPrize function works:", hasPrize);
      console.log("✅ spinCost function works:", ethers.utils.formatEther(spinCost), "ETH");
      console.log("✅ Daily streak function works:", dailyStreak.toString());
      console.log("✅ Weekly streak function works:", weeklyStreak.toString());
      console.log("✅ Last spin block function works:", lastSpinBlock.toString());
      console.log("✅ Last spin boosted function works:", lastSpinBoosted);
      
      console.log("✅ All basic functionality tests passed!");
    } catch (error) {
      console.log("❌ Basic functionality test failed:", error.message);
    }
    
    console.log("\n🏗️ Contract State:");
    console.log("- Status: ✅ ACTIVE");
    console.log("- Type: ERC20 Token + Gambling Game");
    console.log("- Randomness: Block-based entropy");
    
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
