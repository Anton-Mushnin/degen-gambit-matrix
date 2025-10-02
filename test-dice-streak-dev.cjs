const { ethers } = require("hardhat");

async function main() {
    console.log("Testing DiceStreakDev contract...");

    // Contract address from deployment
    const contractAddress = "0x82A31eCFc3B262E118beD8734169329bc850628C";
    
    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    console.log("Testing with account:", deployer.address);

    // Get contract instance
    const DiceStreakDev = await ethers.getContractFactory("DiceStreakDev");
    const contract = DiceStreakDev.attach(contractAddress);

    console.log("\n=== Basic Contract Info ===");
    console.log("Contract Address:", contractAddress);
    console.log("Bet Amount:", ethers.utils.formatEther(await contract.getBetAmount()), "ETH");
    console.log("Payout Multiplier:", (await contract.getPayoutMultiplier()).toString());
    console.log("Bank Balance:", ethers.utils.formatEther(await contract.getBankBalance()), "ETH");
    console.log("Owner:", await contract.owner());

    console.log("\n=== Testing Predetermined Results ===");
    
    // Check initial predetermined result (should be 0)
    let predeterminedResult = await contract.getPredeterminedResult(deployer.address);
    console.log("Initial predetermined result:", predeterminedResult.toString());

    // Set predetermined result to 6
    console.log("Setting predetermined result to 6...");
    const setTx = await contract.setPredeterminedResult(6);
    await setTx.wait();
    console.log("Transaction hash:", setTx.hash);

    // Check predetermined result after setting
    predeterminedResult = await contract.getPredeterminedResult(deployer.address);
    console.log("Predetermined result after setting:", predeterminedResult.toString());

    // Clear predetermined result using 0
    console.log("Clearing predetermined result using 0...");
    const clearTx = await contract.setPredeterminedResult(0);
    await clearTx.wait();
    console.log("Transaction hash:", clearTx.hash);

    // Check predetermined result after clearing
    predeterminedResult = await contract.getPredeterminedResult(deployer.address);
    console.log("Predetermined result after clearing:", predeterminedResult.toString());

    console.log("\n=== Player Status ===");
    console.log("Player Streak:", await contract.getPlayerStreak(deployer.address));
    console.log("Player Total Winnings:", ethers.utils.formatEther(await contract.getPlayerTotalWinnings(deployer.address)), "ETH");
    console.log("Game Status:", (await contract.getGameStatus(deployer.address)).toString());
    console.log("Last Bet Result:", (await contract.getLastBetResult(deployer.address)).toString());

    console.log("\n✅ All tests completed successfully!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Test failed:", error);
        process.exit(1);
    });
