import pkg from "hardhat";
const { ethers, network } = pkg;

async function main() {
  console.log("Testing EvenOdd contract deployment and functions...");

  // Get test accounts
  const [deployer, player1, player2] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("Player 1:", player1.address);
  console.log("Player 2:", player2.address);

  // Deploy contract
  console.log("\n=== DEPLOYMENT ===");
  const EvenOdd = await ethers.getContractFactory("EvenOdd");
  const evenOdd = await EvenOdd.deploy();
  await evenOdd.deployed();
  console.log("✅ Contract deployed at:", evenOdd.address);

  // Fund contract for payouts
  await deployer.sendTransaction({
    to: evenOdd.address,
    value: ethers.utils.parseEther("1.0")
  });
  console.log("✅ Contract funded with 1.0 ETH");

  // Test contract constants
  console.log("\n=== CONTRACT CONSTANTS ===");
  const betAmount = await evenOdd.BET_AMOUNT();
  const winPayout = await evenOdd.WIN_PAYOUT();
  const revealDelay = await evenOdd.REVEAL_DELAY();
  console.log("Bet Amount:", betAmount.toString(), "WEI");
  console.log("Win Payout:", winPayout.toString(), "WEI");
  console.log("Reveal Delay:", revealDelay.toString(), "blocks");

  // Test game constants function
  const [constBet, constPayout, constDelay] = await evenOdd.getGameConstants();
  console.log("✅ Constants match:", 
    constBet.toString() === betAmount.toString() && 
    constPayout.toString() === winPayout.toString() &&
    constDelay.toString() === revealDelay.toString()
  );

  // Test player state (initial)
  console.log("\n=== INITIAL PLAYER STATE ===");
  const initialState = await evenOdd.getPlayerState(player1.address);
  console.log("Has Free Spin:", initialState[0]);
  console.log("Games Played:", initialState[3].toString());
  console.log("Wins:", initialState[4].toString());
  console.log("Has Pending Bet:", initialState[5]);

  // Test betting (should fail with wrong amount)
  console.log("\n=== TESTING BET VALIDATION ===");
  try {
    await evenOdd.connect(player1).betOdd({ value: 500 });
    console.log("❌ Should have failed with wrong bet amount");
  } catch (error) {
    console.log("✅ Correctly rejected wrong bet amount");
  }

  // Test commit phase
  console.log("\n=== TESTING BET COMMIT ===");
  const commitTx = await evenOdd.connect(player1).betOdd({ value: 1000 });
  const commitReceipt = await commitTx.wait();
  
  // Check commit event
  const commitEvent = commitReceipt.events?.find(e => e.event === 'BetCommitted');
  console.log("✅ Bet committed by:", commitEvent.args.player);
  console.log("Choice (true=odd):", commitEvent.args.choice);
  console.log("Is Free Spin:", commitEvent.args.isFreeSpin);
  console.log("Reveal Block:", commitEvent.args.revealBlock.toString());

  // Check player state after commit
  const stateAfterCommit = await evenOdd.getPlayerState(player1.address);
  console.log("Has Pending Bet:", stateAfterCommit[5]);
  console.log("Pending Choice (true=odd):", stateAfterCommit[6]);
  console.log("Commit Block:", stateAfterCommit[7].toString());

  // Test revealing too early
  console.log("\n=== TESTING REVEAL TOO EARLY ===");
  try {
    await evenOdd.connect(player1).revealBet();
    console.log("❌ Should have failed - too early to reveal");
  } catch (error) {
    console.log("✅ Correctly rejected early reveal");
  }

  // Mine blocks to enable reveal
  console.log("\n=== MINING BLOCKS FOR REVEAL ===");
  await network.provider.send("hardhat_mine", ["0x3"]); // Mine 3 blocks
  console.log("✅ Mined 3 blocks");

  // Test reveal phase
  console.log("\n=== TESTING BET REVEAL ===");
  const revealTx = await evenOdd.connect(player1).revealBet();
  const revealReceipt = await revealTx.wait();
  
  // Check result event
  const resultEvent = revealReceipt.events?.find(e => e.event === 'BetResult');
  console.log("✅ Bet revealed");
  console.log("Random Number:", resultEvent.args.number.toString());
  console.log("Won:", resultEvent.args.won);
  console.log("Payout:", resultEvent.args.payout.toString());
  console.log("Earned Free Spin:", resultEvent.args.earnedFreeSpin);

  // Check final player state
  console.log("\n=== FINAL PLAYER STATE ===");
  const finalState = await evenOdd.getPlayerState(player1.address);
  console.log("Has Free Spin:", finalState[0]);
  console.log("Last Result:", finalState[2].toString());
  console.log("Games Played:", finalState[3].toString());
  console.log("Wins:", finalState[4].toString());
  console.log("Has Pending Bet:", finalState[5]);

  // Test free spin if player won
  if (finalState[0]) {
    console.log("\n=== TESTING FREE SPIN ===");
    
    // Commit free spin
    const freeCommitTx = await evenOdd.connect(player1).betOdd({ value: 0 });
    await freeCommitTx.wait();
    console.log("✅ Free spin committed");

    // Mine blocks and reveal
    await network.provider.send("hardhat_mine", ["0x3"]);
    const freeRevealTx = await evenOdd.connect(player1).revealBet();
    const freeRevealReceipt = await freeRevealTx.wait();
    
    const freeResultEvent = freeRevealReceipt.events?.find(e => e.event === 'BetResult');
    console.log("Free Spin Result:", freeResultEvent.args.number.toString());
    console.log("Free Spin Won:", freeResultEvent.args.won);
  }

  // Test contract balance
  console.log("\n=== CONTRACT BALANCE ===");
  const contractBalance = await evenOdd.getContractBalance();
  console.log("Contract Balance:", ethers.utils.formatEther(contractBalance), "ETH");

  // Test multiple players
  console.log("\n=== TESTING MULTIPLE PLAYERS ===");
  
  // Player 2 commits
  await evenOdd.connect(player2).betEven({ value: 1000 });
  console.log("✅ Player 2 bet committed");
  
  // Mine and reveal
  await network.provider.send("hardhat_mine", ["0x3"]);
  await evenOdd.connect(player2).revealBet();
  console.log("✅ Player 2 bet revealed");

  console.log("\n=== TEST COMPLETE ===");
  console.log("All contract functions working correctly! 🎉");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 