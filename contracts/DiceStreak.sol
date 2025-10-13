// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./CommitRevealRandomness.sol";

contract DiceStreak is CommitRevealRandomness {
    // Contract constants
    uint256 public immutable betAmount;
    uint256 public immutable payoutMultiplier; // Basis points (5500 = 5.5x)
    
    // Game state - initialized inline with default values
    enum GameStatus { DiceReady, Rolling }
    enum BetResult { None, Win, Loss }

    address public owner;

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
    event Spin(address indexed player);
    event PlayerWin(address indexed player, uint8 guess, uint8 result, uint256 payout);
    event PlayerWinWithCombo(address indexed player, uint8 guess, uint8 result, uint256 basePayout, uint256 bonusPayout);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    constructor(uint256 _betAmount, uint256 _payoutMultiplier) {
        betAmount = _betAmount;
        payoutMultiplier = _payoutMultiplier;
        owner = msg.sender;
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
        // If player has unresolved bet, preview the outcome
        if (players[player].gameStatus == GameStatus.Rolling) {
            uint256 randomNumber = super.previewReveal("", player);
            uint8 result = uint8((randomNumber % 6) + 1);
            uint8 guess = players[player].pendingGuess;
            
            if (result == guess) {
                // Win: return streak with pending result appended
                uint8[] memory currentStreak = players[player].streak;
                uint8[] memory previewStreak = new uint8[](currentStreak.length + 1);
                for (uint8 i = 0; i < currentStreak.length; i++) {
                    previewStreak[i] = currentStreak[i];
                }
                previewStreak[currentStreak.length] = result;
                return previewStreak;
            } else {
                // Loss: return empty array
                return new uint8[](0);
            }
        }
        
        // No pending bet, return current streak
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

        // Request randomness first (this will auto-resolve any pending commits)
        move(bytes32(0), 256);

        // Now update player state for the new bet
        players[msg.sender].gameStatus = GameStatus.Rolling;
        players[msg.sender].pendingGuess = guess;

        // Update statistics
        statistics[guess].bets++;
    }
    
    // Accept the game result after inspecting with inspectOutcome()
    function accept() public virtual {
        require(players[msg.sender].gameStatus == GameStatus.Rolling, "Not in rolling phase");

        // Get random number using parent's reveal function with empty data (simple mode)
        uint256 randomNumber = super.reveal("");

        // Process the game result
        _processGameResult(msg.sender, randomNumber);
    }

    /// @notice Check if player has a pending bet that can be auto-resolved
    function _hasPendingResolvableBet() internal override view returns (bool) {
        return players[msg.sender].gameStatus == GameStatus.Rolling;
    }

    /// @notice Process auto-resolved bet result
    function _processAutoResolvedBet(uint256 randomNumber) internal override {
        _processGameResult(msg.sender, randomNumber);
    }

    /// @notice Inspect the outcome of a dice roll without executing the reveal
    /// @param player The player's address to inspect outcome for
    /// @return prizeValue The prize amount that would be won (0 for loss)
    /// @return additionalData Encoded dice result: abi.encode(uint32 result)
    function inspectOutcome(address player) external view virtual override returns (uint256 prizeValue, bytes memory additionalData) {
        // Use parent's previewReveal function to get the random number
        uint256 randomNumber = super.previewReveal("", player);

        // Generate the dice result from the random number
        uint8 result = uint8((randomNumber % 6) + 1);
        uint8 guess = players[player].pendingGuess;

        if (result == guess) {
            // Calculate win amount (would need to check streak combos too)
            uint256 basePayout = (betAmount * payoutMultiplier) / 1000;

            // Check for streak combo (simplified - would need full logic)
            (, uint256 bonusPayout, ) = _checkStreakComboPreview(player, result);

            prizeValue = basePayout + bonusPayout;
        } else {
            prizeValue = 0;
        }
        
        // Encode as uint32
        additionalData = abi.encode(uint32(result));
    }

    /// @notice Preview streak combo check without modifying state
    function _checkStreakComboPreview(address player, uint8 newResult) internal view returns (bool hasCombo, uint256 bonusPayout, string memory comboType) {
        uint8[] memory currentStreak = players[player].streak;
        uint8 newLength = uint8(currentStreak.length + 1);
        
        if (newLength < 3) {
            return (false, 0, "");
        }

        // Create temporary streak with new result
        uint8[] memory tempStreak = new uint8[](newLength);
        for (uint8 i = 0; i < currentStreak.length; i++) {
            tempStreak[i] = currentStreak[i];
        }
        tempStreak[newLength - 1] = newResult;

        // Check if last 3 elements form a combo pattern
        if (tempStreak[newLength - 1] - tempStreak[newLength - 2] == tempStreak[newLength - 2] - tempStreak[newLength - 3]) {
            uint256 bankShare = _getBankShare(newLength);
            uint256 bonus = (address(this).balance * bankShare) / 10000;
            return (true, bonus, "");
        }
        
        return (false, 0, "");
    }
    
    function _processGameResult(address player, uint256 randomNumber) internal virtual {
        uint8 result = uint8((randomNumber % 6) + 1);
        uint8 guess = players[player].pendingGuess;
        
        // Emit spin event
        emit Spin(player);
        
        // Update statistics
        statistics[result].occurrences++;
        
        // Check win condition
        if (result == guess) {
            _handleWin(player, guess, result);
        } else {
            _handleLoss(player);
        }
        
        // Reset player state
        players[player].gameStatus = GameStatus.DiceReady;
        players[player].pendingGuess = 0;
    }
    
    function _handleWin(address player, uint8 guess, uint8 result) internal {
        uint256 basePayout = (betAmount * payoutMultiplier) / 1000;
        
        // Add to player's streak
        players[player].streak.push(result);
        
        // Update best combo if current streak is longer
        if (players[player].streak.length > bestCombo.streakFaces.length) {
            bestCombo.streakFaces = players[player].streak;
            bestCombo.player = player;
        }
        
        // Check for streak combo
        (bool hasCombo, uint256 bonusPayout) = _checkStreakCombo(player);
        
        uint256 totalPayout = basePayout;
        if (hasCombo) {
            totalPayout += bonusPayout;
            emit PlayerWinWithCombo(player, guess, result, basePayout, bonusPayout);
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
    
    function _handleLoss(address player) internal {
        // Reset player's streak
        delete players[player].streak;

        players[player].lastBetResult = BetResult.Loss;
    }
    
    function _checkStreakCombo(address player) internal view returns (bool hasCombo, uint256 bonusPayout) {
        uint8[] memory streak = players[player].streak;
        uint8 length = uint8(streak.length);
        
        if (length < 3) {
            return (false, 0);
        }

        if (streak[length - 1] - streak[length - 2] == streak[length - 2] - streak[length - 3]) {
            uint256 bankShare = _getBankShare(length);
            uint256 bonus = (address(this).balance * bankShare) / 10000;
            return (true, bonus);
        }
        
        return (false, 0);
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

    function withdraw() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }

    // Allow contract to receive ETH for payouts
    receive() external payable {}
}