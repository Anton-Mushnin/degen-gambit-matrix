// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @title PlaceDrawRandomness
/// @notice Template contract implementing Place/Draw pattern for secure randomness
/// @dev Uses future block hash approach - place bet now, draw result later
contract PlaceDrawRandomness {
    
    /// @notice Number of blocks to wait before drawing result
    uint256 public constant DRAW_DELAY = 3;
    
    /// @notice Block hash expiry window (EVM limitation)
    uint256 public constant DRAW_WINDOW = 256;
    
    /// @notice Player's current bet state
    struct PlayerBet {
        bool hasActiveBet;      // Whether player has a pending bet
        uint256 betAmount;      // Amount wagered
        bytes32 betData;        // Encoded bet parameters (choice, nonce, etc.)
        uint256 placeBlock;     // Block when bet was placed
        uint256 drawBlock;      // Block when result can be drawn
    }
    
    /// @notice Mapping from player address to their current bet
    mapping(address => PlayerBet) public playerBets;
    
    /// @notice Emitted when a player places a bet
    event BetPlaced(
        address indexed player,
        uint256 betAmount,
        uint256 placeBlock,
        uint256 drawBlock
    );
    
    /// @notice Emitted when a result is drawn
    event ResultDrawn(
        address indexed player,
        uint256 randomNumber,
        bool won,
        uint256 payout
    );
    
    /// @notice Emitted when a bet expires without being drawn
    event BetExpired(address indexed player, uint256 betAmount);
    
    /// @notice Error when player already has an active bet
    error BetAlreadyActive();
    
    /// @notice Error when player has no active bet to draw
    error NoBetToDrawn();
    
    /// @notice Error when trying to draw too early
    error DrawTooEarly(uint256 currentBlock, uint256 drawBlock);
    
    /// @notice Error when draw window has expired
    error DrawWindowExpired(uint256 currentBlock, uint256 expiryBlock);
    
    /// @notice Error when insufficient payment provided
    error InsufficientPayment(uint256 provided, uint256 required);
    
    /// @notice Error when payout transfer fails
    error PayoutFailed();
    
    /// @notice Place a bet with specific parameters
    /// @param betData Encoded bet parameters (game-specific)
    function placeBet(bytes32 betData) external payable virtual {
        PlayerBet storage bet = playerBets[msg.sender];
        
        // Check if player already has an active bet
        if (bet.hasActiveBet) {
            revert BetAlreadyActive();
        }
        
        // Validate minimum bet amount (can be overridden)
        _validateBetAmount(msg.value);
        
        // Calculate draw block
        uint256 drawBlock = block.number + DRAW_DELAY;
        
        // Store bet information
        bet.hasActiveBet = true;
        bet.betAmount = msg.value;
        bet.betData = betData;
        bet.placeBlock = block.number;
        bet.drawBlock = drawBlock;
        
        emit BetPlaced(msg.sender, msg.value, block.number, drawBlock);
    }
    
    /// @notice Draw the result of a placed bet
    /// @return randomNumber The generated random number
    /// @return won Whether the player won
    /// @return payout Amount paid out to player
    function drawResult() external virtual returns (uint256 randomNumber, bool won, uint256 payout) {
        PlayerBet storage bet = playerBets[msg.sender];
        
        // Check if player has an active bet
        if (!bet.hasActiveBet) {
            revert NoBetToDrawn();
        }
        
        // Check if enough blocks have passed
        if (block.number < bet.drawBlock) {
            revert DrawTooEarly(block.number, bet.drawBlock);
        }
        
        // Check if draw window hasn't expired
        uint256 expiryBlock = bet.drawBlock + DRAW_WINDOW;
        if (block.number > expiryBlock) {
            // Bet has expired - clear state but forfeit funds
            _clearBet(msg.sender);
            emit BetExpired(msg.sender, bet.betAmount);
            revert DrawWindowExpired(block.number, expiryBlock);
        }
        
        // Generate secure random number
        randomNumber = _generateRandomNumber(bet.drawBlock, bet.betData, msg.sender);
        
        // Determine outcome (game-specific logic)
        won = _determineOutcome(randomNumber, bet.betData, bet.betAmount);
        
        // Calculate payout
        payout = won ? _calculatePayout(bet.betAmount, bet.betData) : 0;
        
        // Clear bet state
        _clearBet(msg.sender);
        
        // Transfer payout if won
        if (payout > 0) {
            _transferPayout(msg.sender, payout);
        }
        
        emit ResultDrawn(msg.sender, randomNumber, won, payout);
    }
    
    /// @notice Check if a bet can be drawn (is ready and not expired)
    /// @param player Player address to check
    /// @return canDraw Whether the bet can be drawn
    /// @return blocksUntilReady Blocks until draw is ready (0 if ready)
    /// @return blocksUntilExpiry Blocks until draw expires
    function checkDrawStatus(address player) 
        external 
        view 
        returns (bool canDraw, uint256 blocksUntilReady, uint256 blocksUntilExpiry) 
    {
        PlayerBet storage bet = playerBets[player];
        
        if (!bet.hasActiveBet) {
            return (false, 0, 0);
        }
        
        uint256 currentBlock = block.number;
        uint256 expiryBlock = bet.drawBlock + DRAW_WINDOW;
        
        if (currentBlock >= bet.drawBlock && currentBlock <= expiryBlock) {
            canDraw = true;
            blocksUntilReady = 0;
        } else if (currentBlock < bet.drawBlock) {
            canDraw = false;
            blocksUntilReady = bet.drawBlock - currentBlock;
        } else {
            canDraw = false;
            blocksUntilReady = 0;
        }
        
        blocksUntilExpiry = currentBlock >= expiryBlock ? 0 : expiryBlock - currentBlock;
    }
    
    /// @notice Generate secure random number using future block hash
    /// @param targetBlock Block number to use for randomness
    /// @param betData Bet parameters for additional entropy
    /// @param player Player address for additional entropy
    /// @return Random number
    function _generateRandomNumber(
        uint256 targetBlock,
        bytes32 betData,
        address player
    ) internal view virtual returns (uint256) {
        bytes32 blockHash = blockhash(targetBlock);
        require(blockHash != bytes32(0), "Block hash not available");
        
        return uint256(keccak256(abi.encodePacked(
            blockHash,
            betData,
            player,
            targetBlock
        )));
    }
    
    /// @notice Validate bet amount (override for game-specific logic)
    /// @param amount Bet amount to validate
    function _validateBetAmount(uint256 amount) internal view virtual {
        // Override in derived contracts for specific requirements
    }
    
    /// @notice Determine if player won (override for game-specific logic)
    /// @param randomNumber Generated random number
    /// @param betData Player's bet parameters
    /// @param betAmount Player's bet amount
    /// @return Whether player won
    function _determineOutcome(
        uint256 randomNumber,
        bytes32 betData,
        uint256 betAmount
    ) internal view virtual returns (bool) {
        // Must be overridden in derived contracts
    }
    
    /// @notice Calculate payout amount (override for game-specific logic)
    /// @param betAmount Original bet amount
    /// @param betData Bet parameters
    /// @return Payout amount
    function _calculatePayout(uint256 betAmount, bytes32 betData) 
        internal 
        view 
        virtual 
        returns (uint256) 
    {
        // Must be overridden in derived contracts
    }
    
    /// @notice Transfer payout to winner
    /// @param winner Address to receive payout
    /// @param amount Amount to transfer
    function _transferPayout(address winner, uint256 amount) internal virtual {
        (bool success, ) = payable(winner).call{value: amount}("");
        if (!success) {
            revert PayoutFailed();
        }
    }
    
    /// @notice Clear player's bet state
    /// @param player Player address
    function _clearBet(address player) internal {
        delete playerBets[player];
    }
    
    /// @notice Allow contract to receive ETH
    receive() external payable {}
    
    /// @notice Get contract balance
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
} 