// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./CommitRevealRandomness.sol";

contract DiceStreak is CommitRevealRandomness {
    // Contract constants
    uint256 public immutable betAmount;
    uint256 public immutable payoutMultiplier; // Basis points (5500 = 5.5x)
    
    // Game state - initialized inline with default values
    enum GameStatus { DiceReady, Rolling, Claiming }
    enum BetResult { None, Win, Loss }
    
    // Player data
    struct PlayerData {
        uint8[] streak;
        uint256 totalWinnings;
        GameStatus gameStatus;
        BetResult lastBetResult;
        uint8 pendingGuess;
    }
    
    struct ComboInfo {
        uint8[] streakFaces;
        address player;
    }
    
    struct Statistics {
        uint256 occurrences;
        uint256 bets;
        uint256 wins;
    }
    
    // Storage
    mapping(address => PlayerData) public players;
    ComboInfo public bestCombo;
    mapping(uint8 => Statistics) public statistics; // 1-6
    
    // Events
    event PlayerWin(address indexed player, uint8 guess, uint8 result, uint256 payout);
    event PlayerWinWithCombo(address indexed player, uint8 guess, uint8 result, uint256 basePayout, uint256 bonusPayout, string comboType);
    
    constructor(uint256 _betAmount, uint256 _payoutMultiplier) {
        betAmount = _betAmount;
        payoutMultiplier = _payoutMultiplier;
    }
    
    // Public getters
    function getBetAmount() public view returns (uint256) {
        return betAmount;
    }
    
    function getPayoutMultiplier() public view returns (uint256) {
        return payoutMultiplier;
    }
    
    function getBankBalance() public view returns (uint256) {
        return address(this).balance;
    }
    
    function getBestCombo() public view returns (uint8[] memory streakFaces, address player) {
        return (bestCombo.streakFaces, bestCombo.player);
    }
    
    function getPlayerStreak(address player) public view returns (uint8[] memory) {
        return players[player].streak;
    }
    
    function getPlayerTotalWinnings(address player) public view returns (uint256) {
        return players[player].totalWinnings;
    }
    
    function getGameStatus(address player) public view returns (GameStatus) {
        return players[player].gameStatus;
    }
    
    function getLastBetResult(address player) public view returns (BetResult) {
        return players[player].lastBetResult;
    }
    
    function getStatistics(uint8 number) public view returns (uint256 occurrences, uint256 bets, uint256 wins) {
        require(number >= 1 && number <= 6, "Invalid number");
        Statistics memory stats = statistics[number];
        return (stats.occurrences, stats.bets, stats.wins);
    }
    
    // Main game function
    function play(uint8 guess) public payable {
        require(guess >= 1 && guess <= 6, "Guess must be 1-6");
        require(msg.value == betAmount, "Incorrect bet amount");
        require(players[msg.sender].gameStatus == GameStatus.DiceReady, "Game not ready");
        
        // Update player state
        players[msg.sender].gameStatus = GameStatus.Rolling;
        players[msg.sender].pendingGuess = guess;
        
        // Update statistics
        statistics[guess].bets++;
        
        // Request randomness (simple mode with no data validation)
        move(bytes32(0), 256);
    }
    
    // Override reveal function from CommitRevealRandomness
    function reveal() public {
        require(players[msg.sender].gameStatus == GameStatus.Rolling, "Not in rolling phase");
        
        uint256 randomNumber = super.reveal("");
        
        players[msg.sender].gameStatus = GameStatus.Claiming;
        
        // Process the game result
        _processGameResult(msg.sender, randomNumber);
    }
    
    function _processGameResult(address player, uint256 randomNumber) internal {
        uint8 result = uint8((randomNumber % 6) + 1);
        uint8 guess = players[player].pendingGuess;
        
        // Update statistics
        statistics[result].occurrences++;
        
        // Check win condition
        if (result == guess) {
            _handleWin(player, guess, result);
        } else {
            _handleLoss(player, guess, result);
        }
        
        // Reset player state
        players[player].gameStatus = GameStatus.DiceReady;
        players[player].pendingGuess = 0;
    }
    
    function _handleWin(address player, uint8 guess, uint8 result) internal {
        uint256 basePayout = (betAmount * payoutMultiplier) / 1000;
        
        // Add to player's streak
        players[player].streak.push(result);
        
        // Check for streak combo
        (bool hasCombo, uint256 bonusPayout, string memory comboType) = _checkStreakCombo(player);
        
        uint256 totalPayout = basePayout;
        if (hasCombo) {
            totalPayout += bonusPayout;
            emit PlayerWinWithCombo(player, guess, result, basePayout, bonusPayout, comboType);
        } else {
            emit PlayerWin(player, guess, result, basePayout);
        }
        
        // Pay out winnings
        players[player].totalWinnings += totalPayout;
        payable(player).transfer(totalPayout);
        
        // Update statistics
        statistics[guess].wins++;
        
        players[player].lastBetResult = BetResult.Win;
    }
    
    function _handleLoss(address player, uint8 guess, uint8 result) internal {
        // Reset player's streak
        delete players[player].streak;
        
        players[player].lastBetResult = BetResult.Loss;
    }
    
    function _checkStreakCombo(address player) internal returns (bool hasCombo, uint256 bonusPayout, string memory comboType) {
        uint8[] memory streak = players[player].streak;
        uint8 length = uint8(streak.length);
        
        if (length < 3) {
            return (false, 0, "");
        }
        
        // Check last 3+ numbers for combos
        for (uint8 i = 3; i <= length; i++) {
            uint8[] memory lastNumbers = new uint8[](i);
            for (uint8 j = 0; j < i; j++) {
                lastNumbers[j] = streak[length - i + j];
            }
            
            (bool isCombo, string memory detectedType) = _detectCombo(lastNumbers);
            if (isCombo) {
                uint256 bankShare = _getBankShare(i);
                uint256 bonus = (address(this).balance * bankShare) / 10000; // Basis points
                
                // Update best combo if this is better
                if (i > bestCombo.streakFaces.length) {
                    bestCombo.streakFaces = lastNumbers;
                    bestCombo.player = player;
                }
                
                return (true, bonus, detectedType);
            }
        }
        
        return (false, 0, "");
    }
    
    function _detectCombo(uint8[] memory numbers) internal pure returns (bool isCombo, string memory comboType) {
        uint8 length = uint8(numbers.length);
        
        // Check all equal
        bool allEqual = true;
        for (uint8 i = 1; i < length; i++) {
            if (numbers[i] != numbers[0]) {
                allEqual = false;
                break;
            }
        }
        if (allEqual) {
            return (true, "All Equal");
        }
        
        // Check increasing sequence
        bool increasing = true;
        for (uint8 i = 1; i < length; i++) {
            if (numbers[i] != numbers[i-1] + 1) {
                increasing = false;
                break;
            }
        }
        if (increasing) {
            return (true, "Increasing");
        }
        
        // Check decreasing sequence
        bool decreasing = true;
        for (uint8 i = 1; i < length; i++) {
            if (numbers[i] != numbers[i-1] - 1) {
                decreasing = false;
                break;
            }
        }
        if (decreasing) {
            return (true, "Decreasing");
        }
        
        return (false, "");
    }
    
    function _getBankShare(uint8 streakLength) internal pure returns (uint256) {
        if (streakLength == 3) return 200; // 2%
        if (streakLength == 4) return 500; // 5%
        if (streakLength == 5) return 1500; // 15%
        if (streakLength == 6) return 5000; // 50%
        return 0;
    }
}