// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./CommitRevealRandomness.sol";

contract EvenOdd is CommitRevealRandomness {
    uint256 public constant BET_AMOUNT = 1000 wei;
    uint256 public constant WIN_PAYOUT = 1400 wei;
    
    address public owner;
    
    struct LastResult {
        uint256 number;
        bool won;
        uint256 payout;
        bool isFreeSpin;
    }
    
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
        require(msg.value == BET_AMOUNT, "Bet amount must be exactly 1000 wei");
        require(!this.hasCommit(msg.sender), "You have a pending bet");
        
        // Commit the choice using CommitRevealRandomness
        bytes32 choiceHash = keccak256(abi.encodePacked(choice, msg.sender));
        this.move(choiceHash, 0); // No reveal delay needed
    }
    
    function revealBet() external {
        require(this.hasCommit(msg.sender), "No bet to reveal");
        
        // Get the committed choice from the hash
        (bytes32 committedHash,) = this.getCommitDetails(msg.sender);
        
        // Try both odd and even to find the correct choice
        string memory choice;
        bytes32 oddHash = keccak256(abi.encodePacked("odd", msg.sender));
        bytes32 evenHash = keccak256(abi.encodePacked("even", msg.sender));
        
        if (committedHash == oddHash) {
            choice = "odd";
        } else if (committedHash == evenHash) {
            choice = "even";
        } else {
            revert("Invalid choice hash");
        }
        
        // Reveal and get random number using CommitRevealRandomness
        bytes memory choiceData = abi.encodePacked(choice);
        uint256 randomNumber = this.reveal(choiceData) % 100;
        
        bool isOdd = randomNumber % 2 == 1;
        bool won = false;
        uint256 payout = 0;
        
        if (keccak256(abi.encodePacked(choice)) == keccak256(abi.encodePacked("odd"))) {
            won = isOdd;
        } else {
            won = !isOdd;
        }
        
        if (won) {
            payout = WIN_PAYOUT;
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
        
        // Emit result
        emit BetResult(msg.sender, randomNumber, won, payout, false);
        
        // Process free spin if available
        if (hasFreeSpin[msg.sender]) {
            _activateFreeSpin(msg.sender, choice);
        }
    }
    
    function _activateFreeSpin(address player, string memory choice) internal {
        // Commit the free spin choice using CommitRevealRandomness
        bytes32 choiceHash = keccak256(abi.encodePacked(choice, player));
        this.move(choiceHash, 0); // No reveal delay needed
        
        hasFreeSpin[player] = false;
    }
    
    function revealFreeSpin() external {
        require(this.hasCommit(msg.sender), "No free spin to reveal");
        
        // Get the committed choice from the hash
        (bytes32 committedHash,) = this.getCommitDetails(msg.sender);
        
        // Try both odd and even to find the correct choice
        string memory choice;
        bytes32 oddHash = keccak256(abi.encodePacked("odd", msg.sender));
        bytes32 evenHash = keccak256(abi.encodePacked("even", msg.sender));
        
        if (committedHash == oddHash) {
            choice = "odd";
        } else if (committedHash == evenHash) {
            choice = "even";
        } else {
            revert("Invalid choice hash");
        }
        
        // Reveal and get random number using CommitRevealRandomness
        bytes memory choiceData = abi.encodePacked(choice);
        uint256 randomNumber = this.reveal(choiceData) % 100;
        
        bool isOdd = randomNumber % 2 == 1;
        bool won = false;
        uint256 payout = 0;
        
        if (keccak256(abi.encodePacked(choice)) == keccak256(abi.encodePacked("odd"))) {
            won = isOdd;
        } else {
            won = !isOdd;
        }
        
        if (won) {
            payout = WIN_PAYOUT;
            // Activate another free spin
            hasFreeSpin[msg.sender] = true;
            emit FreeSpin(msg.sender, choice);
        }
        
        // Update last result
        lastResults[msg.sender] = LastResult({
            number: randomNumber,
            won: won,
            payout: payout,
            isFreeSpin: true
        });
        
        // Emit result
        emit BetResult(msg.sender, randomNumber, won, payout, true);
        
        // Process another free spin if available
        if (hasFreeSpin[msg.sender]) {
            _activateFreeSpin(msg.sender, choice);
        }
    }
    
    function getGameStatus(address player) external view returns (string memory) {
        if (hasFreeSpin[player]) {
            return "Free Spin Active";
        }
        if (this.hasCommit(player)) {
            return "Bet Pending";
        }
        return "Normal";
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