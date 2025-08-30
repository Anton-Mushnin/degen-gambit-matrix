// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./CommitRevealRandomness.sol";

contract EvenOdd is CommitRevealRandomness {
    uint256 public constant BET_AMOUNT = 1000 wei;
    uint256 public constant WIN_PAYOUT = 1400 wei;
    
    address public owner;
    
    struct Bet {
        string choice;
        uint256 timestamp;
        bool isFreeSpin;
    }
    
    struct LastResult {
        uint256 number;
        bool won;
        uint256 payout;
        bool isFreeSpin;
    }
    
    mapping(address => Bet) public playerBets;
    mapping(address => LastResult) public lastResults;
    mapping(address => bool) public hasFreeSpin;
    
    event BetResult(address indexed player, uint256 number, bool won, uint256 payout, bool isFreeSpin);
    event FreeSpin(address indexed player, string choice);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier validChoice(string memory choice) {
        require(
            keccak256(abi.encodePacked(choice)) == keccak256(abi.encodePacked("odd")) ||
            keccak256(abi.encodePacked(choice)) == keccak256(abi.encodePacked("even")),
            "Invalid choice. Must be 'odd' or 'even'"
        );
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    function bet(string memory choice) external payable validChoice(choice) {
        bool isFreeSpin = hasFreeSpin[msg.sender];

        if (this.hasCommit(msg.sender)) {
            revert("Player already has a commit - EvenOdd");
        }
        
        if (!isFreeSpin) {
            require(msg.value == BET_AMOUNT, "Bet amount must be exactly 1000 wei");
        } else {
            require(msg.value == 0, "Free spin requires no bet amount");
        }

        
        // Store the player's choice
        playerBets[msg.sender] = Bet({
            choice: choice,
            timestamp: block.timestamp,
            isFreeSpin: isFreeSpin
        });
        
        // Clear free spin flag if it was used
        if (isFreeSpin) {
            hasFreeSpin[msg.sender] = false;
        }
        
        // Call move with Bytes32(0) to get randomness
        move(bytes32(0), 256);
    }
    
    function revealBet() external {
                // Get the stored choice
        
        // Reveal with empty bytes to get random number
        uint256 randomNumber = this.reveal("") % 100;
        
        bool isOdd = randomNumber % 2 == 1;
        bool won = false;
        uint256 payout = 0;
        
        string memory choice = playerBets[msg.sender].choice;
        if (keccak256(abi.encodePacked(choice)) == keccak256(abi.encodePacked("odd"))) {
            won = isOdd;
        } else {
            won = !isOdd;
        }
        
        if (won) {
            payout = WIN_PAYOUT;
            // Send winnings to player
            payable(msg.sender).transfer(WIN_PAYOUT);
            // Activate free spin
            hasFreeSpin[msg.sender] = true;
            emit FreeSpin(msg.sender, choice);
        }
        
        // Update last result
        lastResults[msg.sender] = LastResult({
            number: randomNumber,
            won: won,
            payout: payout,
            isFreeSpin: false
        });
        
        // Clear the bet
        delete playerBets[msg.sender];
        
        // Emit result
        emit BetResult(msg.sender, randomNumber, won, payout, false);
    }
    
    
    function playerHasFreeSpin(address player) external view returns (bool) {
        return hasFreeSpin[player];
    }
    
    function playerHasCommit(address player) external view returns (bool) {
        return this.hasCommit(player);
    }
    
    function getLastResult(address player) external view returns (string memory) {
        LastResult memory result = lastResults[player];
        if (result.number == 0) {
            return "No previous result";
        }
        
        string memory numberType = result.number % 2 == 1 ? "odd" : "even";
        string memory resultText = result.won ? "WON" : "LOST";
        string memory spinType = result.isFreeSpin ? "FREE SPIN " : "";
        
        return string(abi.encodePacked(
            spinType,
            "Number: ",
            _uint2str(result.number),
            " (",
            numberType,
            ") - ",
            resultText,
            result.won ? string(abi.encodePacked(" +", _uint2str(result.payout), " WEI")) : ""
        ));
    }
    
    function _uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) {
            return "0";
        }
        uint256 j = _i;
        uint256 length;
        while (j != 0) {
            length++;
            j /= 10;
        }
        bytes memory bstr = new bytes(length);
        uint256 k = length;
        while (_i != 0) {
            k -= 1;
            uint8 temp = (48 + uint8(_i - _i / 10 * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }
    
    function withdraw() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }
    
    receive() external payable {}
} 