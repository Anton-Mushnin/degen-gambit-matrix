// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract EvenOdd {
    uint256 public constant BET_AMOUNT = 1000; // 1000 WEI
    uint256 public constant WIN_PAYOUT = 1400; // 1400 WEI (1.4x)
    uint256 public constant REVEAL_DELAY = 3; // Wait 3 blocks for randomness
    
    struct PlayerState {
        bool hasFreeSpin;
        bool freeSpinChoice; // true = odd, false = even
        uint256 lastResult;
        uint256 gamesPlayed;
        uint256 wins;
        
        // Pending bet data
        bool hasPendingBet;
        bool pendingChoice;
        uint256 commitBlock;
        bool pendingIsFreeSpin;
    }
    
    mapping(address => PlayerState) public players;
    
    // Events for stream
    event BetCommitted(address indexed player, bool choice, bool isFreeSpin, uint256 revealBlock);
    event BetResult(address indexed player, uint256 number, bool choice, bool won, uint256 payout, bool earnedFreeSpin);
    event FreeSpin(address indexed player, bool choice);
    
    // Generate random number using future block hash
    function generateRandomNumber(uint256 blockNumber) private view returns (uint256) {
        require(block.number > blockNumber, "Block not yet available");
        require(block.number <= blockNumber + 256, "Block hash no longer available");
        
        bytes32 blockHash = blockhash(blockNumber);
        require(blockHash != bytes32(0), "Block hash not available");
        
        return uint256(keccak256(abi.encodePacked(
            blockHash,
            msg.sender,
            blockNumber
        ))) % 1000 + 1; // 1-1000 range
    }
    
    // Step 1: Commit to a bet
    function placeBet(bool choice) public payable {
        PlayerState storage player = players[msg.sender];
        
        require(!player.hasPendingBet, "Already have pending bet, call revealBet first");
        
        // Check if this is a free spin
        if (player.hasFreeSpin) {
            require(choice == player.freeSpinChoice, "Must use same choice for free spin");
            require(msg.value == 0, "Free spin requires no payment");
        } else {
            require(msg.value == BET_AMOUNT, "Must bet exactly 1000 WEI");
        }
        
        // Store pending bet
        player.hasPendingBet = true;
        player.pendingChoice = choice;
        player.commitBlock = block.number;
        player.pendingIsFreeSpin = player.hasFreeSpin;
        
        uint256 revealBlock = block.number + REVEAL_DELAY;
        emit BetCommitted(msg.sender, choice, player.hasFreeSpin, revealBlock);
    }
    
    // Step 2: Reveal the bet result using future block hash
    function revealBet() external {
        PlayerState storage player = players[msg.sender];
        
        require(player.hasPendingBet, "No pending bet to reveal");
        
        uint256 revealBlock = player.commitBlock + REVEAL_DELAY;
        require(block.number > revealBlock, "Must wait for reveal block");
        require(block.number <= revealBlock + 256, "Reveal window expired, bet forfeited");
        
        // Generate random number using future block hash
        uint256 randomNumber = generateRandomNumber(revealBlock);
        bool isOdd = (randomNumber % 2) == 1;
        bool won = (player.pendingChoice == isOdd);
        
        // Update player stats
        player.lastResult = randomNumber;
        player.gamesPlayed++;
        
        uint256 payout = 0;
        bool earnedFreeSpin = false;
        
        if (won) {
            player.wins++;
            payout = WIN_PAYOUT;
            
            // Award payout
            payable(msg.sender).transfer(payout);
            
            // Grant free spin with same choice (only if this wasn't already a free spin)
            if (!player.pendingIsFreeSpin) {
                player.hasFreeSpin = true;
                player.freeSpinChoice = player.pendingChoice;
                earnedFreeSpin = true;
                emit FreeSpin(msg.sender, player.pendingChoice);
            }
        } else {
            // Lost - clear free spin status
            player.hasFreeSpin = false;
        }
        
        // Clear pending bet
        player.hasPendingBet = false;
        
        // Emit result event
        emit BetResult(msg.sender, randomNumber, player.pendingChoice, won, payout, earnedFreeSpin);
    }
    
    // Convenience functions for frontend
    function betOdd() external payable {
        placeBet(true);
    }
    
    function betEven() external payable {
        placeBet(false);
    }
    
    // View functions for game info
    function getPlayerState(address player) external view returns (
        bool hasFreeSpin,
        bool freeSpinChoice,
        uint256 lastResult,
        uint256 gamesPlayed,
        uint256 wins,
        bool hasPendingBet,
        bool pendingChoice,
        uint256 commitBlock,
        uint256 revealBlock
    ) {
        PlayerState memory state = players[player];
        uint256 reveal = state.hasPendingBet ? state.commitBlock + REVEAL_DELAY : 0;
        return (
            state.hasFreeSpin,
            state.freeSpinChoice,
            state.lastResult,
            state.gamesPlayed,
            state.wins,
            state.hasPendingBet,
            state.pendingChoice,
            state.commitBlock,
            reveal
        );
    }
    
    function getGameConstants() external pure returns (uint256 betAmount, uint256 winPayout, uint256 revealDelay) {
        return (BET_AMOUNT, WIN_PAYOUT, REVEAL_DELAY);
    }
    
    // Contract balance (pot)
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    // Allow contract to receive funds
    receive() external payable {}
    
    // Withdraw function for contract owner (emergency)
    address public owner;
    
    constructor() {
        owner = msg.sender;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }
    
    function withdraw() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }
} 