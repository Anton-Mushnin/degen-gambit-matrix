// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./DiceRun.sol";

contract DiceRunDev is DiceRun {
    // Mapping to store predetermined roll results for testing
    mapping(address => uint8) public predeterminedResults;
    
    constructor(
        uint256 _betAmount,
        uint256 _basicPayoutMultiplier,
        uint256 _streakBankShare3,
        uint256 _streakBankShare4,
        uint256 _streakBankShare5,
        uint256 _streakBankShare6,
        uint256 _investmentFeePercent
    ) DiceRun(
        _betAmount,
        _basicPayoutMultiplier,
        _streakBankShare3,
        _streakBankShare4,
        _streakBankShare5,
        _streakBankShare6,
        _investmentFeePercent
    ) {
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
    
    /// @notice Override accept to use predetermined results when available
    function accept() public override {
        require(players[msg.sender].hasPendingBet, "No pending bet to accept");

        // Always get random number using parent's reveal function
        uint256 randomNumber = super.reveal("");

        // Process the game result (will check for predetermined value inside)
        _processGameResult(msg.sender, randomNumber);
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
        
        uint256 guess = players[player].pendingGuess;
        
        // Update dice statistics
        diceOccurrences[result]++;
        diceBets[guess]++;
        
        // Check win condition
        if (result == guess) {
            diceWins[guess]++;
            _handleWin(player, result);
        } else {
            _handleLoss(player);
        }
        
        // Reset player state
        players[player].hasPendingBet = false;
        players[player].pendingGuess = 0;
        
        emit BetPlaced(player, guess, betAmount);
    }
    
    /// @notice Override inspect outcome to use predetermined results when available
    /// @param player The player's address to inspect outcome for
    /// @return prizeValue The prize amount that would be won (0 for loss)
    /// @return additionalData Encoded dice result and streak info
    function inspectOutcome(address player) external view override returns (uint256 prizeValue, bytes memory additionalData) {
        // Always use parent's previewReveal function to get the random number
        uint256 randomNumber = super.previewReveal("", player);
        
        uint8 result;
        // Check if there's a predetermined result for this player
        if (predeterminedResults[player] != 0) {
            result = predeterminedResults[player];
        } else {
            result = uint8((randomNumber % 6) + 1);
        }

        uint256 guess = players[player].pendingGuess;

        if (result == guess) {
            // Calculate win amount
            prizeValue = betAmount * basicPayoutMultiplier / 10000;
            
            // Check for streak bonus (simplified preview)
            uint256 currentStreakLength = players[player].currentStreak;
            if (currentStreakLength >= 2) { // Will be 3+ after this win
                uint256 nextStreakLength = currentStreakLength + 1;
                if (nextStreakLength >= 3 && nextStreakLength <= 6) {
                    uint256 bonusAmount = 0;
                    if (nextStreakLength == 3) bonusAmount = (address(this).balance * streakBankShare3) / 10000;
                    else if (nextStreakLength == 4) bonusAmount = (address(this).balance * streakBankShare4) / 10000;
                    else if (nextStreakLength == 5) bonusAmount = (address(this).balance * streakBankShare5) / 10000;
                    else if (nextStreakLength == 6) bonusAmount = (address(this).balance * streakBankShare6) / 10000;
                    prizeValue += bonusAmount;
                }
            }
        } else {
            prizeValue = 0;
        }
        
        // Encode result and streak info
        additionalData = abi.encode(uint32(result), uint32(players[player].currentStreak));
    }

    /// @notice Override getPotentialBonusAmount to use predetermined results when available
    function getPotentialBonusAmount(address player) external view override returns (uint256) {
        if (!players[player].hasPendingBet) {
            return 0;
        }

        uint8 result;
        // Check if there's a predetermined result for this player
        if (predeterminedResults[player] != 0) {
            result = predeterminedResults[player];
        } else {
            uint256 randomNumber = super.previewReveal("", player);
            result = uint8((randomNumber % 6) + 1);
        }

        uint256 guess = players[player].pendingGuess;
        if (result != guess) {
            return 0; // No bonus for losing bets
        }

        uint256 currentStreakLength = players[player].currentStreak;
        uint256 potentialStreakLength = currentStreakLength + 1;

        if (potentialStreakLength >= 3 && potentialStreakLength <= 6) {
            uint256 bonusAmount = 0;
            if (potentialStreakLength == 3) bonusAmount = (address(this).balance * streakBankShare3) / 10000;
            else if (potentialStreakLength == 4) bonusAmount = (address(this).balance * streakBankShare4) / 10000;
            else if (potentialStreakLength == 5) bonusAmount = (address(this).balance * streakBankShare5) / 10000;
            else if (potentialStreakLength == 6) bonusAmount = (address(this).balance * streakBankShare6) / 10000;
            return bonusAmount;
        }

        return 0;
    }

    /// @notice Override getCurrentShareValue to use predetermined results when available
    function getCurrentShareValue(address player) external view override returns (uint256) {
        uint256 sharePercentage = investors[player].sharePercentage;

        if (players[player].hasPendingBet) {
            uint8 result;
            // Check if there's a predetermined result for this player
            if (predeterminedResults[player] != 0) {
                result = predeterminedResults[player];
            } else {
                uint256 randomNumber = super.previewReveal("", player);
                result = uint8((randomNumber % 6) + 1);
            }

            if (result == players[player].pendingGuess) {
                // Would win - check if streak bonus would affect shares
                uint256 currentStreakLength = players[player].currentStreak;
                uint256 newStreakLength = currentStreakLength + 1;
                if (newStreakLength >= 3 && newStreakLength <= 6) {
                    uint256 bonusAmount = 0;
                    if (newStreakLength == 3) bonusAmount = (address(this).balance * streakBankShare3) / 10000;
                    else if (newStreakLength == 4) bonusAmount = (address(this).balance * streakBankShare4) / 10000;
                    else if (newStreakLength == 5) bonusAmount = (address(this).balance * streakBankShare5) / 10000;
                    else if (newStreakLength == 6) bonusAmount = (address(this).balance * streakBankShare6) / 10000;

                    if (bonusAmount > 0) {
                        uint256 currentBalance = address(this).balance;
                        if (totalBankShares > 0 && currentBalance > bonusAmount) {
                            return (sharePercentage * (currentBalance - bonusAmount)) / 10000;
                        }
                    }
                }
            }
        }

        // Normal case or no pending bet
        if (totalBankShares > 0) {
            return (sharePercentage * address(this).balance) / 10000;
        }
        return 0;
    }

    /// @notice Override getPlayerShareChange to use predetermined results when available
    function getPlayerShareChange(address player) external view override returns (int256) {
        // If player has pending bet, preview the outcome
        if (players[player].hasPendingBet) {
            uint8 result;
            // Check if there's a predetermined result for this player
            if (predeterminedResults[player] != 0) {
                result = predeterminedResults[player];
            } else {
                uint256 randomNumber = super.previewReveal("", player);
                result = uint8((randomNumber % 6) + 1);
            }

            if (result == players[player].pendingGuess) {
                // Would win - check if streak bonus would affect shares
                uint256 currentStreakLength = players[player].currentStreak;
                uint256 newStreakLength = currentStreakLength + 1;
                if (newStreakLength >= 3 && newStreakLength <= 6) {
                    uint256 bonusAmount = 0;
                    if (newStreakLength == 3) bonusAmount = (address(this).balance * streakBankShare3) / 10000;
                    else if (newStreakLength == 4) bonusAmount = (address(this).balance * streakBankShare4) / 10000;
                    else if (newStreakLength == 5) bonusAmount = (address(this).balance * streakBankShare5) / 10000;
                    else if (newStreakLength == 6) bonusAmount = (address(this).balance * streakBankShare6) / 10000;

                    if (bonusAmount > 0) {
                        uint256 sharePercentage = investors[player].sharePercentage;
                        if (totalBankShares > 0) {
                            uint256 currentValue = (sharePercentage * address(this).balance) / 10000;
                            uint256 newValue = (sharePercentage * (address(this).balance - bonusAmount)) / 10000;
                            return int256(newValue) - int256(currentValue);
                        }
                    }
                }
            }
        }

        return 0; // No change if no pending bet or no streak bonus
    }

    /// @notice Override getPlayerCurrentStreak to use predetermined results when available
    function getPlayerCurrentStreak(address player) external view override returns (uint256) {
        // If player has pending bet, preview the outcome
        if (players[player].hasPendingBet) {
            uint8 result;
            // Check if there's a predetermined result for this player
            if (predeterminedResults[player] != 0) {
                result = predeterminedResults[player];
            } else {
                uint256 randomNumber = super.previewReveal("", player);
                result = uint8((randomNumber % 6) + 1);
            }

            if (result == players[player].pendingGuess) {
                return players[player].currentStreak + 1;
            } else {
                return 0; // Streak would be reset
            }
        }

        return players[player].currentStreak;
    }
}
