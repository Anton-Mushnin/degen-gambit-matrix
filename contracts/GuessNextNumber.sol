// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./CommitRevealRandomness.sol";

contract GuessNextNumber is CommitRevealRandomness {
    // Contract constants
    uint256 public immutable costOfPlay;
    uint256 public immutable payoutMultiplier; // Basis points (5800 = 5.8x)
    uint256 public constant depositFeePercent = 1; // 1%
    uint256 public constant MIN_BANK_MULTIPLIER = 11; // Bank must have 11x bet

    // Streak bonus percentages in basis points
    uint256 public constant STREAK_3_BONUS = 100;  // 1%
    uint256 public constant STREAK_4_BONUS = 500;  // 5%
    uint256 public constant STREAK_5_BONUS = 1500; // 15%
    uint256 public constant STREAK_6_BONUS = 5000; // 50%

    address public owner;

    // Player game status
    enum PlayerStatus { Ready, Pending, Accepting, Accepted }

    // Player data for game
    struct PlayerGameData {
        uint8 currentStreak;
        uint256 totalWinnings;
        PlayerStatus status;
        uint8 pendingGuess;
    }

    // Player data for bank
    struct PlayerBankData {
        uint256 sharesBasisPoints; // Share in basis points (10000 = 100%)
        uint256 totalDeposits;
        uint256 totalWithdrawals;
    }

    // Statistics for each number
    struct NumberStats {
        uint256 occurrences;
    }

    // Best streak record
    struct BestStreakRecord {
        uint8 streakLength;
        address player;
    }

    // Storage
    mapping(address => PlayerGameData) public playerGameData;
    mapping(address => PlayerBankData) public playerBankData;
    NumberStats[6] public statistics; // Index 0-5 for numbers 1-6
    BestStreakRecord public bestStreak;
    uint256 public totalSharesBasisPoints; // Total shares issued

    // Events
    event GuessCommitted(address indexed player, uint8 guess);
    event PlayerWin(address indexed player, uint8 guess, uint8 result, uint256 payout);
    event StreakBonus(address indexed player, uint8 streakLength, uint256 bonusAmount);
    event BankDeposit(address indexed player, uint256 amount, uint256 newSharePercent);
    event BankWithdrawal(address indexed player, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor(uint256 _costOfPlay, uint256 _payoutMultiplier) {
        costOfPlay = _costOfPlay;
        payoutMultiplier = _payoutMultiplier;
        owner = msg.sender;
    }

    // ============ Public Getters ============

    function getBankBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function getStreakBonuses() public view returns (
        uint256 bonus3,
        uint256 bonus4,
        uint256 bonus5,
        uint256 bonus6
    ) {
        uint256 bank = address(this).balance;
        bonus3 = (bank * STREAK_3_BONUS) / 10000;
        bonus4 = (bank * STREAK_4_BONUS) / 10000;
        bonus5 = (bank * STREAK_5_BONUS) / 10000;
        bonus6 = (bank * STREAK_6_BONUS) / 10000;
    }

    function getStatistics() public view returns (NumberStats[6] memory) {
        return statistics;
    }

    function getBestStreak() public view returns (uint8 streakLength, address player) {
        return (bestStreak.streakLength, bestStreak.player);
    }

    function getPlayerStatus(address player) public view returns (PlayerStatus) {
        // If player has pending commit ready for reveal, show as Accepting
        if (playerGameData[player].status == PlayerStatus.Pending) {
            CommitData storage commit = playerCommits[player];
            if (commit.commitBlock != 0 && _blockNumber() > commit.commitBlock) {
                return PlayerStatus.Accepting;
            }
        }
        return playerGameData[player].status;
    }

    function getPlayerStreak(address player) public view returns (uint8) {
        // If player has unresolved bet, preview the outcome
        if (playerGameData[player].status == PlayerStatus.Pending || 
            playerGameData[player].status == PlayerStatus.Accepting) {
            CommitData storage commit = playerCommits[player];
            if (commit.commitBlock != 0 && _blockNumber() > commit.commitBlock) {
                uint256 randomNumber = super.previewReveal("", player);
                uint8 result = uint8((randomNumber % 6) + 1);
                uint8 playerGuess = playerGameData[player].pendingGuess;
                
                if (result == playerGuess) {
                    // Win: return incremented streak (capped at 6)
                    uint8 newStreak = playerGameData[player].currentStreak + 1;
                    return newStreak > 6 ? 0 : newStreak; // Reset after 6
                } else {
                    // Loss: streak resets
                    return 0;
                }
            }
        }
        return playerGameData[player].currentStreak;
    }

    function getPlayerTotalWinnings(address player) public view returns (uint256) {
        return playerGameData[player].totalWinnings;
    }

    function getPlayerShare(address player) public view returns (uint256) {
        return playerBankData[player].sharesBasisPoints;
    }

    function getPlayerShareValue(address player) public view returns (uint256) {
        if (totalSharesBasisPoints == 0) return 0;
        return (address(this).balance * playerBankData[player].sharesBasisPoints) / totalSharesBasisPoints;
    }

    function getPlayerTotalEarnings(address player) public view returns (int256) {
        uint256 shareValue = getPlayerShareValue(player);
        uint256 totalWithdrawals = playerBankData[player].totalWithdrawals;
        uint256 totalDeposits = playerBankData[player].totalDeposits;
        
        // earnings = withdrawals + current share value - deposits
        int256 earnings = int256(totalWithdrawals) + int256(shareValue) - int256(totalDeposits);
        return earnings;
    }

    // ============ Game Functions ============

    function guess(uint8 guessedNumber) public payable {
        require(guessedNumber >= 1 && guessedNumber <= 6, "Guess must be 1-6");
        require(msg.value == costOfPlay, "Incorrect bet amount");
        require(address(this).balance >= costOfPlay * MIN_BANK_MULTIPLIER, "Bank too low");

        // Request randomness (this will auto-resolve any pending commits)
        move(bytes32(0), 256);

        // Update player state
        playerGameData[msg.sender].status = PlayerStatus.Pending;
        playerGameData[msg.sender].pendingGuess = guessedNumber;

        emit GuessCommitted(msg.sender, guessedNumber);
    }

    function accept() public {
        require(
            playerGameData[msg.sender].status == PlayerStatus.Pending ||
            playerGameData[msg.sender].status == PlayerStatus.Accepting,
            "No pending guess"
        );

        // Get random number
        uint256 randomNumber = super.reveal("");

        // Process result
        _processGameResult(msg.sender, randomNumber);
    }

    function inspectOutcome(address player) external view override returns (uint256 prizeValue, bytes memory additionalData) {
        // Use parent's previewReveal to get random number
        uint256 randomNumber = super.previewReveal("", player);

        uint8 result = uint8((randomNumber % 6) + 1);
        uint8 guessedNumber = playerGameData[player].pendingGuess;

        if (result == guessedNumber) {
            // Calculate base payout
            uint256 basePayout = (costOfPlay * payoutMultiplier) / 1000;
            
            // Calculate streak bonus preview
            uint8 newStreak = playerGameData[player].currentStreak + 1;
            uint256 bonusPayout = 0;
            
            if (newStreak >= 3 && newStreak <= 6) {
                bonusPayout = _getStreakBonusAmount(newStreak);
            }

            prizeValue = basePayout + bonusPayout;
        } else {
            prizeValue = 0;
        }

        // Encode result
        additionalData = abi.encode(uint32(result));
    }

    // ============ Bank Functions ============

    function deposit() public payable {
        require(msg.value > 0, "Must deposit something");

        uint256 fee = (msg.value * depositFeePercent) / 100;
        uint256 netDeposit = msg.value - fee;
        uint256 currentBank = address(this).balance - msg.value; // Balance before this deposit

        uint256 newShares;
        if (totalSharesBasisPoints == 0) {
            // First depositor gets 100%
            newShares = 10000;
        } else {
            // Calculate new shares: (netDeposit / (currentBank + netDeposit)) * 10000
            // But we need to account for existing shares dilution
            newShares = (netDeposit * totalSharesBasisPoints) / (currentBank + netDeposit);
        }

        playerBankData[msg.sender].sharesBasisPoints += newShares;
        playerBankData[msg.sender].totalDeposits += msg.value;
        totalSharesBasisPoints += newShares;

        uint256 sharePercent = (playerBankData[msg.sender].sharesBasisPoints * 100) / totalSharesBasisPoints;
        
        emit BankDeposit(msg.sender, msg.value, sharePercent);
    }

    function withdraw(uint256 amount) public {
        require(amount > 0, "Must withdraw something");
        
        uint256 shareValue = getPlayerShareValue(msg.sender);
        require(amount <= shareValue, "Insufficient share value");

        // Calculate shares to burn
        uint256 sharesToBurn = (amount * playerBankData[msg.sender].sharesBasisPoints) / shareValue;
        
        playerBankData[msg.sender].sharesBasisPoints -= sharesToBurn;
        playerBankData[msg.sender].totalWithdrawals += amount;
        totalSharesBasisPoints -= sharesToBurn;

        payable(msg.sender).transfer(amount);

        emit BankWithdrawal(msg.sender, amount);
    }

    // ============ Internal Functions ============

    function _hasPendingResolvableBet() internal override view returns (bool) {
        return playerGameData[msg.sender].status == PlayerStatus.Pending ||
               playerGameData[msg.sender].status == PlayerStatus.Accepting;
    }

    function _processAutoResolvedBet(uint256 randomNumber) internal override {
        _processGameResult(msg.sender, randomNumber);
    }

    function _processGameResult(address player, uint256 randomNumber) internal {
        uint8 result = uint8((randomNumber % 6) + 1);
        uint8 guessedNumber = playerGameData[player].pendingGuess;

        // Update statistics
        statistics[result - 1].occurrences++;

        if (result == guessedNumber) {
            _handleWin(player, guessedNumber, result);
        } else {
            _handleLoss(player);
        }

        // Reset player state
        playerGameData[player].status = PlayerStatus.Ready;
        playerGameData[player].pendingGuess = 0;
    }

    function _handleWin(address player, uint8 guessedNumber, uint8 result) internal {
        uint256 basePayout = (costOfPlay * payoutMultiplier) / 1000;
        
        // Increment streak
        uint8 newStreak = playerGameData[player].currentStreak + 1;
        
        // Check for streak bonus
        uint256 bonusPayout = 0;
        if (newStreak >= 3 && newStreak <= 6) {
            bonusPayout = _getStreakBonusAmount(newStreak);
            emit StreakBonus(player, newStreak, bonusPayout);
        }

        // Update streak (reset after 6)
        if (newStreak >= 6) {
            playerGameData[player].currentStreak = 0;
        } else {
            playerGameData[player].currentStreak = newStreak;
        }

        // Update best streak
        if (newStreak > bestStreak.streakLength) {
            bestStreak.streakLength = newStreak;
            bestStreak.player = player;
        }

        uint256 totalPayout = basePayout + bonusPayout;
        playerGameData[player].totalWinnings += totalPayout;

        emit PlayerWin(player, guessedNumber, result, totalPayout);

        payable(player).transfer(totalPayout);
    }

    function _handleLoss(address player) internal {
        // Reset streak
        playerGameData[player].currentStreak = 0;
    }

    function _getStreakBonusAmount(uint8 streakLength) internal view returns (uint256) {
        uint256 bank = address(this).balance;
        if (streakLength == 3) return (bank * STREAK_3_BONUS) / 10000;
        if (streakLength == 4) return (bank * STREAK_4_BONUS) / 10000;
        if (streakLength == 5) return (bank * STREAK_5_BONUS) / 10000;
        if (streakLength == 6) return (bank * STREAK_6_BONUS) / 10000;
        return 0;
    }

    // ============ Admin Functions ============

    function withdrawOwner(uint256 amount) external onlyOwner {
        require(amount <= address(this).balance, "Insufficient balance");
        payable(owner).transfer(amount);
    }

    // Allow contract to receive ETH
    receive() external payable {}
}

