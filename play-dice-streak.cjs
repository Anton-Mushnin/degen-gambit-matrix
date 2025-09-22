const { ethers } = require('ethers');
require('dotenv').config();

async function main() {
  console.log("🎲 Testing DiceStreak Game Play...");

  // Contract address - replace with actual deployed address
  const CONTRACT_ADDRESS = "0x874b7ebEE68624303aBA0D09eFd2EA3ee8385080"; // XAI testnet deployment

  // Setup provider and wallet for XAI testnet
  const provider = new ethers.providers.JsonRpcProvider({
    url: "https://testnet-v2.xai-chain.net/rpc",
    // Disable ENS for testnets
    ensAddress: null
  });
  const privateKey = process.env.DEPLOYMENT_KEY;

  if (!privateKey) {
    throw new Error("DEPLOYMENT_KEY not found in environment variables");
  }

  const wallet = new ethers.Wallet(privateKey, provider);
  console.log("🎯 Player Address:", wallet.address);

  // Contract ABI for playing DiceStreak
  const abi = [
    "function play(uint8 guess) external payable",
    "function accept() external",
    "function inspectOutcome(address player) view returns (uint256 prizeValue, string memory description)",
    "function getBetAmount() view returns (uint256)",
    "function getPayoutMultiplier() view returns (uint256)",
    "function getBankBalance() view returns (uint256)",
    "function getPlayerStreak(address player) view returns (uint8[] memory)",
    "function getPlayerTotalWinnings(address player) view returns (uint256)",
    "function getGameStatus(address player) view returns (uint8)",
    "function getLastBetResult(address player) view returns (uint8)",
    "function hasCommit(address player) view returns (bool)",
    "function getBestCombo() view returns (uint8[] memory streakFaces, address player)"
  ];

  // Get contract instance
  const diceStreak = new ethers.Contract(CONTRACT_ADDRESS, abi, wallet);

  // Get contract constants
  const betAmount = await diceStreak.getBetAmount();
  const payoutMultiplier = await diceStreak.getPayoutMultiplier();
  const bankBalance = await diceStreak.getBankBalance();

  console.log("\n💰 Game Constants:");
  console.log("- Bet Amount:", betAmount.toString(), "WEI");
  console.log("- Payout Multiplier:", payoutMultiplier.toString(), "(", (payoutMultiplier / 1000).toString(), "x)");
  console.log("- Bank Balance:", ethers.utils.formatEther(bankBalance), "ETH");

  // Main game loop
  let gameCount = 0;
  let totalSpent = ethers.BigNumber.from(0);
  let totalWon = ethers.BigNumber.from(0);

  while (gameCount < 5) { // Limit to 5 games for testing
    try {
      gameCount++;
      console.log(`\n🎮 === GAME ROUND ${gameCount} ===`);

      // Check current status
      const gameStatus = await diceStreak.getGameStatus(wallet.address);
      const hasCommit = await diceStreak.hasCommit(wallet.address);
      const playerStreak = await diceStreak.getPlayerStreak(wallet.address);
      const totalWinnings = await diceStreak.getPlayerTotalWinnings(wallet.address);
      const currentBlock = await provider.getBlockNumber();

      console.log("\n🎯 Current Status:");
      console.log("- Game Status:", gameStatus === 0 ? "Ready" : "Rolling");
      console.log("- Has Commit:", hasCommit);
      console.log("- Current Streak:", playerStreak.length, "wins");
      console.log("- Total Winnings:", ethers.utils.formatEther(totalWinnings), "ETH");
      console.log("- Current Block:", currentBlock);

      // Check if player has a pending bet to accept
      if (gameStatus === 1) { // Rolling status
        console.log("\n🎁 Player has a pending bet to accept!");

        // Inspect the outcome first
        try {
          const [prizeValue, description] = await diceStreak.inspectOutcome(wallet.address);
          console.log("\n🔍 Inspecting Outcome:");
          console.log("- Prize Value:", ethers.utils.formatEther(prizeValue), "ETH");
          console.log("- Description:", description);

          // Only accept winning bets
          if (prizeValue.gt(0)) {
            console.log("✅ Accepting winning bet!");

            // Accept the result
            const acceptTx = await diceStreak.accept();
            const receipt = await acceptTx.wait();

            console.log("✅ Bet accepted successfully!");
            console.log("- Gas used:", receipt.gasUsed.toString());

            // Check updated status
            const newStatus = await diceStreak.getGameStatus(wallet.address);
            const newStreak = await diceStreak.getPlayerStreak(wallet.address);
            const newWinnings = await diceStreak.getPlayerTotalWinnings(wallet.address);
            const lastResult = await diceStreak.getLastBetResult(wallet.address);

            console.log("\n📊 Post-Accept Status:");
            console.log("- Game Status:", newStatus === 0 ? "Ready" : "Rolling");
            console.log("- Current Streak:", newStreak.length, "wins");
            console.log("- Total Winnings:", ethers.utils.formatEther(newWinnings), "ETH");
            console.log("- Last Result:", lastResult === 1 ? "Win" : "Loss");

            // Track winnings
            totalWon = totalWon.add(prizeValue);
          } else {
            console.log("❌ Detected losing bet - will place new bet to auto-resolve");
            // Don't accept the loss, but continue to place a new bet below
            // The auto-resolution in move() will handle cleaning up this loss
          }

        } catch (error) {
          console.log("❌ Failed to inspect/accept:", error.message);

          // If it's a timing issue, try to produce a new block
          if (error.message.includes("Reveal block not yet mined")) {
            console.log("⏳ Reveal block not yet mined, producing new block...");

            try {
              // Send 1 WEI to self to produce a new block
              const blockTx = await wallet.sendTransaction({
                to: wallet.address,
                value: ethers.BigNumber.from("1")
              });
              console.log(`📦 Sent 1 WEI to self. Tx: ${blockTx.hash}`);
              await blockTx.wait();
              console.log("✅ Block production confirmed");

              // Wait a moment for the new block
              await new Promise(resolve => setTimeout(resolve, 2000));

              // Try inspect/accept again
              console.log("🔄 Retrying inspect/accept...");
              try {
                const [retryPrizeValue, retryDescription] = await diceStreak.inspectOutcome(wallet.address);
                console.log("\n🔍 Inspecting Outcome (retry):");
                console.log("- Prize Value:", ethers.utils.formatEther(retryPrizeValue), "ETH");
                console.log("- Description:", retryDescription);

                // Only accept winning bets on retry
                if (retryPrizeValue.gt(0)) {
                  console.log("✅ Accepting winning bet on retry!");

                  const retryAcceptTx = await diceStreak.accept();
                  const retryReceipt = await retryAcceptTx.wait();

                  console.log("✅ Bet accepted successfully on retry!");
                  console.log("- Gas used:", retryReceipt.gasUsed.toString());
                } else {
                  console.log("❌ Detected losing bet on retry - will place new bet to auto-resolve");
                  // Continue to place new bet below
                }

              } catch (retryError) {
                console.log("❌ Retry also failed:", retryError.message);
                // Continue to place new bet even if retry failed
              }

            } catch (blockError) {
              console.log("❌ Failed to produce block:", blockError.message);
              // Continue to place new bet
            }
          } else {
            // Other error, continue to place new bet
          }
        }
      }

      // Always try to place a new bet (unless we just accepted a win above)
      // This will auto-resolve any pending losses via the contract's move() function
      console.log("\n🎯 Placing new bet...");

      // Generate a random guess (1-6)
      const guess = Math.floor(Math.random() * 6) + 1;
      console.log("- Guessing number:", guess);

      try {
        // Place the bet
        const playTx = await diceStreak.play(guess, { value: betAmount });
        const receipt = await playTx.wait();

        console.log("✅ Bet placed successfully!");
        console.log("- Gas used:", receipt.gasUsed.toString());
        console.log("- Transaction hash:", receipt.transactionHash);

        totalSpent = totalSpent.add(betAmount);

        // Check status after betting
        const newStatus = await diceStreak.getGameStatus(wallet.address);
        console.log("- New game status:", newStatus === 0 ? "Ready" : "Rolling");

      } catch (error) {
        console.log("❌ Failed to place bet:", error.message);
      }

      // Small delay between games
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.log(`❌ Error in game round ${gameCount}:`, error.message);
      break;
    }
  }

  console.log(`\n🏁 Test completed after ${gameCount} games!`);
  console.log("💰 Total spent:", ethers.utils.formatEther(totalSpent), "ETH");
  console.log("💰 Total won:", ethers.utils.formatEther(totalWon), "ETH");
  console.log("📊 Net result:", ethers.utils.formatEther(totalWon.sub(totalSpent)), "ETH");

  // Final stats
  try {
    const finalStreak = await diceStreak.getPlayerStreak(wallet.address);
    const finalWinnings = await diceStreak.getPlayerTotalWinnings(wallet.address);
    const [bestStreak, bestPlayer] = await diceStreak.getBestCombo();

    console.log("\n📈 Final Statistics:");
    console.log("- Final streak:", finalStreak.length, "wins");
    console.log("- Total winnings:", ethers.utils.formatEther(finalWinnings), "ETH");
    console.log("- Best combo:", bestStreak.length, "wins by", bestPlayer);
  } catch (error) {
    console.log("❌ Failed to get final stats:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("💥 Test failed:", error);
    process.exit(1);
  });
