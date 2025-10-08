// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./CommitRevealRandomness.sol";

contract DiceRun is CommitRevealRandomness {
    // Constructor parameters
    uint256 public immutable betAmount;
    uint256 public immutable basicPayoutMultiplier;
    uint256 public immutable streakBankShare3; // percentage for streak of 3 (basis points)
    uint256 public immutable streakBankShare4; // percentage for streak of 4 (basis points)
    uint256 public immutable streakBankShare5; // percentage for streak of 5 (basis points)
    uint256 public immutable streakBankShare6; // percentage for streak of 6 (basis points)
    uint256 public immutable investmentFeePercent; // basis points

    // Game state
    struct PlayerData {
        uint256[] streak;           // Current winning streak numbers
        uint256 totalWinnings;      // Total ETH won
        uint256 currentStreak;      // Current streak length
        bool hasPendingBet;         // If player has committed bet waiting reveal
        uint256 pendingGuess;       // The number they bet on (1-6)
    }

    struct InvestorData {
        uint256 amountInvested;     // Total net investment (after fee)
        uint256 sharePercentage;    // Current share percentage (basis points)
        uint256 totalWithdrawals;   // Total amount withdrawn from shares
        uint256 totalEarnings;      // Total earnings from bank share distributions
    }

    // Storage
    mapping(address => PlayerData) public players;
    mapping(address => InvestorData) public investors;
    mapping(uint256 => uint256) public diceOccurrences; // diceNumber => count
    mapping(uint256 => uint256) public diceBets;        // diceNumber => bet count
    mapping(uint256 => uint256) public diceWins;        // diceNumber => win count

    uint256 public totalBankShares;     // Sum of all investor shares (basis points)
    uint256 public totalInvested;       // Total net investments in bank
    uint256 public bestStreakLength;
    address public bestStreakPlayer;

    // Events
    event BetPlaced(address indexed player, uint256 numberChosen, uint256 betAmount);
    event PlayerWin(address indexed player, uint256 diceRolled, uint256 payoutAmount);
    event PlayerWinWithStreak(address indexed player, uint256 streakLength, uint256 bonusAmount);
    event Investment(address indexed player, uint256 investmentAmount, uint256 newSharePercentage);
    event NewBestStreak(address indexed player, uint256 newStreakLength);

    constructor(
        uint256 _betAmount,
        uint256 _basicPayoutMultiplier,
        uint256 _streakBankShare3,
        uint256 _streakBankShare4,
        uint256 _streakBankShare5,
        uint256 _streakBankShare6,
        uint256 _investmentFeePercent
    ) {
        betAmount = _betAmount;
        basicPayoutMultiplier = _basicPayoutMultiplier;
        streakBankShare3 = _streakBankShare3;
        streakBankShare4 = _streakBankShare4;
        streakBankShare5 = _streakBankShare5;
        streakBankShare6 = _streakBankShare6;
        investmentFeePercent = _investmentFeePercent;
    }

    // View functions - getters
    function getBetAmount() external view returns (uint256) {
        return betAmount;
    }

    function getBasicPayoutMultiplier() external view returns (uint256) {
        return basicPayoutMultiplier;
    }

    function getStreakBankShares() external view returns (uint256[4] memory) {
        return [streakBankShare3, streakBankShare4, streakBankShare5, streakBankShare6];
    }

    function getInvestmentFeePercent() external view returns (uint256) {
        return investmentFeePercent;
    }

    function getBankBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function getBestStreak() external view returns (uint256 length, address player) {
        return (bestStreakLength, bestStreakPlayer);
    }

    function getDiceStats(uint256 diceNumber) external view returns (uint256 occurrences, uint256 bets, uint256 wins) {
        require(diceNumber >= 1 && diceNumber <= 6, "Invalid dice number");
        return (diceOccurrences[diceNumber], diceBets[diceNumber], diceWins[diceNumber]);
    }

    function getPlayerBankInfo(address player) external view returns (uint256 amountInvested, uint256 sharePercentage) {
        InvestorData memory investor = investors[player];
        return (investor.amountInvested, investor.sharePercentage);
    }

    function getTotalWithdrawals(address player) external view returns (uint256) {
        return investors[player].totalWithdrawals;
    }

    function getTotalEarnings(address player) external view returns (int256) {
        // Calculate current share value: (bankBalance * sharePercentage) / 10000
        // If player has pending bet, preview the outcome for share value calculation
        uint256 currentBalance = address(this).balance;
        uint256 sharePercentage = investors[player].sharePercentage;

        if (players[player].hasPendingBet) {
            uint256 randomNumber = super.previewReveal("", player);
            uint256 diceResult = (randomNumber % 6) + 1;

            if (diceResult == players[player].pendingGuess) {
                // Would win - check if streak bonus would affect shares
                uint256 newStreakLength = players[player].currentStreak + 1;
                if (newStreakLength >= 3) {
                    uint256 bonusAmount = 0;
                    if (newStreakLength == 3) bonusAmount = (currentBalance * streakBankShare3) / 10000;
                    else if (newStreakLength == 4) bonusAmount = (currentBalance * streakBankShare4) / 10000;
                    else if (newStreakLength == 5) bonusAmount = (currentBalance * streakBankShare5) / 10000;
                    else if (newStreakLength == 6) bonusAmount = (currentBalance * streakBankShare6) / 10000;
                    if (bonusAmount > 0) {
                        // Calculate share value after potential bonus payout
                        uint256 currentShares = investors[player].sharePercentage;
                        uint256 totalShares = totalBankShares;
                        if (totalShares > 0) {
                            currentBalance = currentBalance + bonusAmount;
                        }
                    }
                }
            } else {
                // Would lose - no change to share value calculation
            }
        }

        uint256 currentShareValue = (currentBalance * sharePercentage) / 10000;
        uint256 totalWithdrawals = investors[player].totalWithdrawals;
        uint256 amountInvested = investors[player].amountInvested;

        // Calculate: currentShareValue + totalWithdrawals - amountInvested
        // Using int256 to handle negative results (losses)
        int256 earnings = int256(currentShareValue) + int256(totalWithdrawals) - int256(amountInvested);
        return earnings;
    }

    function getCurrentShareValue(address player) external view returns (uint256) {
        // If player has pending bet, preview the outcome for share value calculation
        if (players[player].hasPendingBet) {
            uint256 randomNumber = super.previewReveal("", player);
            uint256 diceResult = (randomNumber % 6) + 1;

            if (diceResult == players[player].pendingGuess) {
                // Would win - check if streak bonus would affect shares
                uint256 newStreakLength = players[player].currentStreak + 1;
                if (newStreakLength >= 3) {
                    uint256 bonusAmount = 0;
                    if (newStreakLength == 3) bonusAmount = (address(this).balance * streakBankShare3) / 10000;
                    else if (newStreakLength == 4) bonusAmount = (address(this).balance * streakBankShare4) / 10000;
                    else if (newStreakLength == 5) bonusAmount = (address(this).balance * streakBankShare5) / 10000;
                    else if (newStreakLength == 6) bonusAmount = (address(this).balance * streakBankShare6) / 10000;
                    if (bonusAmount > 0) {
                        // Calculate share value after potential bonus payout
                        uint256 currentShares = investors[player].sharePercentage;
                        uint256 totalShares = totalBankShares;
                        if (totalShares > 0) {
                            uint256 currentBalance = address(this).balance;
                            uint256 shareValue = (currentBalance * currentShares) / 10000;
                            uint256 shareReduction = (bonusAmount * currentShares) / totalInvested;
                            return shareValue - shareReduction;
                        }
                    }
                }
            }
        }
        // Calculate current share value: (bankBalance * sharePercentage) / 10000
        uint256 currentBalance = address(this).balance;
        uint256 sharePercentage = investors[player].sharePercentage;
        return (currentBalance * sharePercentage) / 10000;
    }

    function getPlayerShareChange(address player) external view returns (int256) {
        // If player has pending bet, preview the outcome
        if (players[player].hasPendingBet) {
            uint256 randomNumber = super.previewReveal("", player);
            uint256 diceResult = (randomNumber % 6) + 1;

            if (diceResult == players[player].pendingGuess) {
                // Would win - check if streak bonus would affect shares
                uint256 newStreakLength = players[player].currentStreak + 1;
                if (newStreakLength >= 3) {
                    uint256 bonusAmount = 0;
                    if (newStreakLength == 3) bonusAmount = (address(this).balance * streakBankShare3) / 10000;
                    else if (newStreakLength == 4) bonusAmount = (address(this).balance * streakBankShare4) / 10000;
                    else if (newStreakLength == 5) bonusAmount = (address(this).balance * streakBankShare5) / 10000;
                    else if (newStreakLength == 6) bonusAmount = (address(this).balance * streakBankShare6) / 10000;
                    if (bonusAmount > 0) {
                        // Calculate share reduction due to bonus payout
                        uint256 currentShares = investors[player].sharePercentage;
                        uint256 totalShares = totalBankShares;
                        if (totalShares > 0) {
                            int256 shareReduction = int256((bonusAmount * currentShares) / totalInvested);
                            return -shareReduction;
                        }
                    }
                }
            }
        }
        return 0;
    }

    function getPlayerTotalWinnings(address player) external view returns (uint256) {
        return players[player].totalWinnings;
    }

    function getPlayerCurrentStreak(address player) external view returns (uint256) {
        // If player has pending bet, preview the outcome
        if (players[player].hasPendingBet) {
            uint256 randomNumber = super.previewReveal("", player);
            uint256 diceResult = (randomNumber % 6) + 1;

            if (diceResult == players[player].pendingGuess) {
                // Would win - return current streak + 1
                return players[player].currentStreak + 1;
            } else {
                // Would lose - return 0
                return 0;
            }
        }
        return players[player].currentStreak;
    }

    function getNextNeededDiceNumber(address player) external view returns (uint256) {
        if (players[player].currentStreak == 0) {
            return 0; // Any number starts new streak
        }

        uint256[] memory streak = players[player].streak;
        if (streak.length == 0) {
            return 0;
        }

        uint256 lastNumber = streak[streak.length - 1];
        uint256 secondLast = streak.length >= 2 ? streak[streak.length - 2] : 0;

        if (streak.length >= 2) {
            // Check for sequential pattern
            int256 diff = int256(lastNumber) - int256(secondLast);
            if (diff == 1) {
                // Ascending sequence: 1->2->3
                return lastNumber + 1;
            } else if (diff == -1) {
                // Descending sequence: 6->5->4
                return lastNumber - 1;
            }
        }

        // Same numbers streak
        return lastNumber;
    }

    function getPotentialBonusAmount(address player) external view returns (uint256) {
        uint256 currentStreak = players[player].currentStreak;
        if (currentStreak < 2) {
            return 0; // Need at least 2 wins for potential 3-win bonus
        }

        uint256 nextStreakLength = currentStreak + 1;
        if (nextStreakLength >= 3 && nextStreakLength <= 6) {
            uint256 bankShare = 0;
            if (nextStreakLength == 3) bankShare = streakBankShare3;
            else if (nextStreakLength == 4) bankShare = streakBankShare4;
            else if (nextStreakLength == 5) bankShare = streakBankShare5;
            else if (nextStreakLength == 6) bankShare = streakBankShare6;
            return (address(this).balance * bankShare) / 10000;
        }

        return 0;
    }

    // Game functions
    function play(uint256 guess) external payable returns (uint256 diceResult, uint256 payout, uint256 streakLength) {
        require(guess >= 1 && guess <= 6, "Guess must be 1-6");
        require(msg.value == betAmount, "Incorrect bet amount");

        // Auto-resolve any pending commits first
        move(bytes32(0), 256);

        // Set up pending bet
        players[msg.sender].hasPendingBet = true;
        players[msg.sender].pendingGuess = guess;

        // Update bet statistics
        diceBets[guess]++;

        // Emit bet placed event
        emit BetPlaced(msg.sender, guess, msg.value);

        // Return 0 values - actual results only available after accept()
        return (0, 0, 0);
    }

    function fund() external payable returns (uint256 netInvestment, uint256 sharesReceived) {
        require(msg.value > 0, "Investment must be greater than 0");

        // Calculate fee
        uint256 fee = (msg.value * investmentFeePercent) / 10000;
        netInvestment = msg.value - fee;

        // Calculate new shares
        uint256 newTotalInvested = totalInvested + netInvestment;
        sharesReceived = totalInvested == 0 ? 10000 : (netInvestment * 10000) / totalInvested;

        // Update investor data
        investors[msg.sender].amountInvested += netInvestment;
        investors[msg.sender].sharePercentage += sharesReceived;

        // Update global totals
        totalInvested = newTotalInvested;
        totalBankShares += sharesReceived;

        emit Investment(msg.sender, msg.value, investors[msg.sender].sharePercentage);

        return (netInvestment, sharesReceived);
    }

    function withdraw(uint256 amount) external returns (uint256 withdrawnAmount) {
        require(amount > 0, "Withdraw amount must be greater than 0");

        uint256 playerShares = investors[msg.sender].sharePercentage;
        require(playerShares > 0, "No shares to withdraw");

        uint256 maxWithdrawable = (totalInvested * playerShares) / 10000;
        withdrawnAmount = amount > maxWithdrawable ? maxWithdrawable : amount;

        // Calculate share reduction
        uint256 sharesToRemove = (withdrawnAmount * 10000) / totalInvested;

        // Update investor data
        investors[msg.sender].amountInvested -= withdrawnAmount;
        investors[msg.sender].sharePercentage -= sharesToRemove;
        investors[msg.sender].totalWithdrawals += withdrawnAmount;

        // Update global totals
        totalInvested -= withdrawnAmount;
        totalBankShares -= sharesToRemove;

        // Transfer funds
        payable(msg.sender).transfer(withdrawnAmount);

        return withdrawnAmount;
    }

    function accept() external {
        require(players[msg.sender].hasPendingBet, "No pending bet to accept");

        // Get random number using parent's reveal function
        uint256 randomNumber = super.reveal("");

        // Process the game result
        _processGameResult(msg.sender, randomNumber);
    }

    function inspectOutcome(address player) external view override returns (uint256 prizeValue, bytes memory additionalData) {
        if (!players[player].hasPendingBet) {
            return (0, "");
        }

        // Get random number using parent's previewReveal function
        uint256 randomNumber = super.previewReveal("", player);
        uint256 diceResult = (randomNumber % 6) + 1;
        uint256 guess = players[player].pendingGuess;

        uint256 payout = 0;
        uint256 potentialStreakLength = 0;

        if (diceResult == guess) {
            // Calculate basic payout
            payout = (betAmount * basicPayoutMultiplier) / 10000;
            potentialStreakLength = players[player].currentStreak + 1;

            // Check for streak bonus
            if (potentialStreakLength >= 3 && potentialStreakLength <= 6) {
                uint256 bonusAmount = 0;
                if (potentialStreakLength == 3) bonusAmount = (address(this).balance * streakBankShare3) / 10000;
                else if (potentialStreakLength == 4) bonusAmount = (address(this).balance * streakBankShare4) / 10000;
                else if (potentialStreakLength == 5) bonusAmount = (address(this).balance * streakBankShare5) / 10000;
                else if (potentialStreakLength == 6) bonusAmount = (address(this).balance * streakBankShare6) / 10000;
                payout += bonusAmount;
            }
        }

        // Encode diceResult and potentialStreakLength
        additionalData = abi.encode(diceResult, potentialStreakLength);

        return (payout, additionalData);
    }

    // Internal functions
    function _hasPendingResolvableBet() internal view override returns (bool) {
        return players[msg.sender].hasPendingBet;
    }

    function _processAutoResolvedBet(uint256 randomNumber) internal override {
        _processGameResult(msg.sender, randomNumber);
    }

    function _processGameResult(address player, uint256 randomNumber) internal {
        uint256 diceResult = (randomNumber % 6) + 1;
        uint256 guess = players[player].pendingGuess;

        // Update dice occurrence statistics
        diceOccurrences[diceResult]++;

        // Reset pending bet state
        players[player].hasPendingBet = false;
        players[player].pendingGuess = 0;

        if (diceResult == guess) {
            _handleWin(player, diceResult);
        } else {
            _handleLoss(player);
        }
    }

    function _handleWin(address player, uint256 diceResult) internal {
        // Calculate basic payout
        uint256 basicPayout = (betAmount * basicPayoutMultiplier) / 10000;

        // Update streak
        players[player].currentStreak++;
        players[player].streak.push(diceResult);

        // Update statistics
        diceWins[diceResult]++;

        // Check for streak bonus
        uint256 bonusAmount = 0;
        if (players[player].currentStreak >= 3 && players[player].currentStreak <= 6) {
            uint256 bankShare = 0;
            if (players[player].currentStreak == 3) bankShare = streakBankShare3;
            else if (players[player].currentStreak == 4) bankShare = streakBankShare4;
            else if (players[player].currentStreak == 5) bankShare = streakBankShare5;
            else if (players[player].currentStreak == 6) bankShare = streakBankShare6;
            bonusAmount = (address(this).balance * bankShare) / 10000;
        }

        uint256 totalPayout = basicPayout + bonusAmount;

        // Update player winnings
        players[player].totalWinnings += totalPayout;

        // Update best streak
        if (players[player].currentStreak > bestStreakLength) {
            bestStreakLength = players[player].currentStreak;
            bestStreakPlayer = player;
            emit NewBestStreak(player, bestStreakLength);
        }

        // Emit appropriate event
        if (bonusAmount > 0) {
            emit PlayerWinWithStreak(player, players[player].currentStreak, bonusAmount);
        } else {
            emit PlayerWin(player, diceResult, basicPayout);
        }

        // Pay out winnings
        payable(player).transfer(totalPayout);
    }

    function _handleLoss(address player) internal {
        // Reset streak
        players[player].currentStreak = 0;
        delete players[player].streak;
    }

    // Allow contract to receive ETH
    receive() external payable {}
}
