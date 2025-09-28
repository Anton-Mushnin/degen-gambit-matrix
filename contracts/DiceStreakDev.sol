// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./DiceStreak.sol";

contract DiceStreakDev is DiceStreak {
    // Mapping to store predetermined roll results for testing
    mapping(address => uint8) public predeterminedResults;
    
    constructor(uint256 _betAmount, uint256 _payoutMultiplier) 
        DiceStreak(_betAmount, _payoutMultiplier) {
    }
    
    /// @notice Set a predetermined roll result for the caller
    /// @param result The dice result to set (1-6, or 0 to clear)
    function setPredeterminedResult(uint8 result) external {
        if (result == 0) {
            delete predeterminedResults[msg.sender];
        } else {
            require(result >= 1 && result <= 6, "Result must be 1-6 or 0 to clear");
            predeterminedResults[msg.sender] = result;
        }
    }

    
    /// @notice Get the predetermined result for a player
    /// @param player The player's address
    /// @return The predetermined result (0 if not set)
    function getPredeterminedResult(address player) external view returns (uint8) {
        return predeterminedResults[player];
    }
    
    /// @notice Override the game result processing to use predetermined results when available
    function _processGameResult(address player, uint256 randomNumber) internal override {
        uint8 result;
        
        // Check if there's a predetermined result for this player
        if (predeterminedResults[player] != 0) {
            result = predeterminedResults[player];
        } else {
            // Use normal random result
            result = uint8((randomNumber % 6) + 1);
        }
        
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
    
    /// @notice Override inspect outcome to use predetermined results when available
    function inspectOutcome(address player) external view override returns (uint8 diceResult, uint256 prizeValue, string memory description) {
        uint256 currentBlock = _blockNumber();
        CommitData storage commit = playerCommits[player];

        // Check if player has committed data
        if (commit.commitBlock == 0) {
            revert("No commit to reveal");
        }

        // Check if reveal block has been mined
        if (currentBlock <= commit.commitBlock) {
            revert("Reveal block not yet mined");
        }

        // Check if reveal is within the allowed window
        if (currentBlock > commit.commitBlock + commit.revealWindow) {
            revert("Reveal window expired");
        }

        uint8 result;
        
        // Check if there's a predetermined result for this player
        if (predeterminedResults[player] != 0) {
            result = predeterminedResults[player];
        } else {
            // Generate the dice result normally
            uint256 randomNumber = _entropy(player, commit.commitBlock);
            result = uint8((randomNumber % 6) + 1);
        }
        
        uint8 guess = players[player].pendingGuess;

        diceResult = result;
        
        if (result == guess) {
            // Calculate win amount (would need to check streak combos too)
            uint256 basePayout = (betAmount * payoutMultiplier) / 1000;

            // Check for streak combo (simplified - would need full logic)
            (bool hasCombo, uint256 bonusPayout, ) = _checkStreakComboPreview(player, result);

            prizeValue = basePayout + bonusPayout;
            if (hasCombo) {
                description = "Win with combo bonus";
            } else {
                description = "Win";
            }
        } else {
            prizeValue = 0;
            description = "Loss";
        }
    }
}
