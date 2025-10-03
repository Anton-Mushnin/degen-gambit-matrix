// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

    /// @notice Arbitrum system interface for L2-specific block functions
    interface ArbSys {
        function arbBlockNumber() external view returns (uint256);
        function arbBlockHash(uint256 number) external view returns (bytes32);
    }

/// @title CommitRevealRandomness
/// @notice Provides secure random numbers using commit/reveal pattern with optional inspection
/// @dev Players commit to data, then can inspect outcomes before revealing
/// @dev Supports both one-step (commit->reveal) and two-step (commit->inspect->reveal) patterns
/// @dev Uses commit block hashes for randomness, with optional data validation
/// @dev Three modes: with dataHash (secure), without dataHash (simple), or with inspection (preview)
/// @dev
/// @dev MODE 1: Secure Commit-Reveal (dataHash provided)
/// @dev - Use case: Multiplayer games where moves are made simultaneously and hidden
/// @dev - Player commits hash of their move/choice (e.g., game action, strategy)
/// @dev - All players commit first, then reveal in reveal window
/// @dev - Must reveal exact data to get random number, throws error if data doesn't match commit
/// @dev - Example: move(hash, 256) -> reveal(data) -> random number
/// @dev
/// @dev MODE 2: Simple Randomness (dataHash = bytes32(0))
/// @dev - Use case: Single player games or when no move verification needed
/// @dev - Player gets random number without data validation
/// @dev - Example: move(bytes32(0), 256) -> reveal("") -> random number
/// @dev
/// @dev MODE 3: Inspection Pattern (any dataHash)
/// @dev - Use case: Gambling games where users want to preview outcomes
/// @dev - Player can inspect outcome before deciding to reveal
/// @dev - Example: move(data, 256) -> inspectOutcome(player) -> reveal(data) -> random number
/// @dev
/// @dev RANDOMNESS: Always generated using commit block hash + player address
/// @dev - Block hash is unpredictable at commit time
/// @dev - Player address prevents identical results across players
abstract contract CommitRevealRandomness {
    

    
    /// @notice Contract version - accessible by frontend
    string public constant COMMIT_REVEAL_RANDOMNESS_VERSION = "1.0.0";
    
    /// @notice Player's committed data and state
    struct CommitData {
        bytes32 committedHash;    // Hash of (data + player)
        uint256 commitBlock;      // Block when commit was made
        uint256 revealWindow;     // Number of blocks after commitBlock for reveal
    }
    
    /// @notice Mapping from player address to their commit data
    mapping(address => CommitData) public playerCommits;
    
    /// @notice Emitted when a player commits data
    event DataCommitted(
        address indexed player,
        bytes32 committedHash,
        uint256 commitBlock,
        uint256 revealWindow
    );
    
    /// @notice Emitted when data is revealed and random number generated
    event DataRevealed(
        address indexed player,
        uint256 randomNumber,
        bytes revealedData
    );
    
    /// @notice Error when player already has committed data
    error AlreadyCommitted();
    
    /// @notice Error when trying to reveal without commit
    error NoCommitToReveal();
    
    /// @notice Error when data has already been revealed
    error AlreadyRevealed();
    
    /// @notice Error when revealed data doesn't match commit hash
    error InvalidReveal();
    
    /// @notice Get current Arbitrum block number
    function _blockNumber() internal view returns (uint256) {
        return ArbSys(address(100)).arbBlockNumber();
    }
    
    /// @notice Get Arbitrum block hash
    function _blockhash(uint256 number) internal view returns (bytes32) {
        return ArbSys(address(100)).arbBlockHash(number);
    }
    
    /// @notice Clear expired commit for the caller
    function clearExpiredCommit() internal {
        CommitData storage commit = playerCommits[msg.sender];

        // Check if commit exists and is expired
        if (commit.commitBlock != 0 && _blockNumber() > commit.commitBlock + commit.revealWindow) {
            commit.committedHash = bytes32(0);
            commit.commitBlock = 0;
            commit.revealWindow = 0;
        }
    }

    /// @notice Check if player has a pending bet that can be auto-resolved
    /// @dev Child contracts should override to check game-specific state
    function _hasPendingResolvableBet() internal virtual view returns (bool) {
        return false; // Default: no pending bets
    }

    /// @notice Process auto-resolved bet result
    /// @dev Child contracts should override to handle game-specific result processing
    function _processAutoResolvedBet(uint256 randomNumber) internal virtual {
        // Default: do nothing
    }

    /// @notice Auto-resolve pending commits before allowing new ones
    /// @dev Handles timing checks and delegates game-specific logic to child contracts
    function _autoResolvePendingCommit() internal {
        CommitData storage commit = playerCommits[msg.sender];
        if (commit.commitBlock != 0) {
            uint256 currentBlock = _blockNumber();
            if (currentBlock == commit.commitBlock) {
                revert("Cannot place new bet in same block as commit");
            }
            if (currentBlock > commit.commitBlock &&
                currentBlock <= commit.commitBlock + commit.revealWindow) {
                // Check if player has a pending bet that can be resolved
                if (_hasPendingResolvableBet()) {
                    uint256 randomNumber = reveal("");
                    _processAutoResolvedBet(randomNumber);
                }
            }
        }
    }
    
    /// @notice Commit data for later reveal
    /// @dev Two modes of operation:
    /// @dev 1. With dataHash: Secure commit-reveal pattern where player commits hash of data
    /// @dev    and must reveal exact data to function don't throw error
    /// @dev 2. Without dataHash: Simple randomness mode where player gets random number
    /// @dev    without data validation
    /// @param dataHash The hash of data to commit (produced on frontend), or bytes32(0) for simple mode
    /// @param revealWindow Number of blocks after commitBlock for reveal. Max 256 blocks.
    function move(bytes32 dataHash, uint256 revealWindow) public {
        uint256 currentBlock = _blockNumber();
        CommitData storage commit = playerCommits[msg.sender];

        // Clear expired commit if it exists
        clearExpiredCommit();

        // Auto-resolve any pending commits ready for reveal
        _autoResolvePendingCommit();

        // Check if player still has committed data after auto-resolution
        if (commit.commitBlock != 0) {
            revert("Already committed");
        }
        
        // Store the provided hash directly (or empty if not provided)
        commit.committedHash = dataHash;
        commit.commitBlock = currentBlock;
        commit.revealWindow = revealWindow;
        
        emit DataCommitted(msg.sender, dataHash, currentBlock, revealWindow);
    }
    
    /// @notice Child contracts must implement inspectOutcome function
    /// @dev Enforced abstract function that all child contracts must implement
    /// @dev First return value must be uint256 prizeValue for consistent interface
    /// @param player The player's address to inspect outcome for
    /// @return prizeValue The prize amount that would be won (0 for loss)
    /// @return additionalData Additional game-specific return data (e.g., dice result, description)
    function inspectOutcome(address player) external view virtual returns (uint256 prizeValue, bytes memory additionalData);

    /// @notice Reveal committed data and generate random number, consuming the commit
    /// @dev Handles both secure commit-reveal and simple randomness modes:
    /// @dev - If dataHash was provided: validates revealed data matches committed hash
    /// @dev - If no dataHash (bytes32(0)): accepts any data (including empty)
    /// @dev Random number is always generated using commit block hash + player address
    /// @dev Consumes the commit data after successful reveal - cannot be called again
    /// @dev No events are emitted to minimize gas costs
    /// @param data The original data that was committed, or bytes32(0) for simple mode
    /// @return randomNumber The generated random number
    function reveal(bytes memory data) public returns (uint256 randomNumber) {
        uint256 currentBlock = _blockNumber();
        CommitData storage commit = playerCommits[msg.sender];
        
        // Check if player has committed data
        if (commit.commitBlock == 0) {
            revert ("No commit to reveal");
        }
        
        // Check if reveal block has been mined
        if (currentBlock <= commit.commitBlock) {
            revert("Reveal block not yet mined");
        }
        
        // Check if reveal is within the allowed window
        if (currentBlock > commit.commitBlock + commit.revealWindow) {
            // Clear expired commit
            clearExpiredCommit();
            revert("Reveal window expired");
        }
        
        // If a hash was committed, data must be provided and must match
        if (commit.committedHash != bytes32(0)) {
            if (data.length == 0) {
                revert("Invalid reveal");
            }
            bytes32 expectedHash = keccak256(abi.encodePacked(data, msg.sender));
            if (expectedHash != commit.committedHash) {
                revert("Invalid reveal");
            }
        }
        
        // Generate random number using entropy
        randomNumber = _entropy(msg.sender, commit.commitBlock);
        
        // Clear commit data after successful reveal
        delete playerCommits[msg.sender];
        

    }
    
    /// @notice Generate entropy for random number generation
    /// @dev Always uses commit block hash + player address for randomness
    /// @dev This provides security regardless of commit-reveal mode used
    /// @dev Block hash is unpredictable at commit time due to commit block usage
    /// @param player The player's address
    /// @param commitBlock The block number to use for entropy
    /// @return Entropy value
    function _entropy(
        address player,
        uint256 commitBlock
    ) internal view virtual returns (uint256) {
        return
            uint256(
                keccak256(
                    abi.encode(
                        _blockhash(commitBlock),
                        player
                    )
                )
            );
    }
    
    /// @notice Get bounded random number in range [1, max]
    /// @param max Maximum value (inclusive)
    /// @return Random number between 1 and max
    function revealInRange(bytes calldata data, uint256 max) external returns (uint256) {
        require(max > 0, "Max must be positive");
        uint256 randomNumber = this.reveal(data);
        return (randomNumber % max) + 1;
    }
    
    /// @notice Get random boolean (true/false)
    /// @return Random boolean
    function revealBool(bytes calldata data) external returns (bool) {
        uint256 randomNumber = this.reveal(data);
        return (randomNumber % 2) == 1;
    }
    
    /// @notice Check if player has committed data
    /// @param player Player address to check
    /// @return hasCommitted Whether player has committed data
    function hasCommit(address player) external view returns (bool hasCommitted) {
        CommitData storage commit = playerCommits[player];
        hasCommitted = commit.commitBlock != 0;
    }
    
    /// @notice Preview what random number would be generated without consuming the commit
    /// @dev View function that performs same validation as reveal but doesn't delete commit data
    /// @dev Useful for inspection patterns where users want to see outcome before revealing
    /// @dev Can be called by child contracts internally
    /// @param data The original data that was committed, or bytes32(0) for simple mode
    /// @return randomNumber The random number that would be generated
    function previewReveal(bytes memory data) public view returns (uint256 randomNumber) {
        uint256 currentBlock = _blockNumber();
        CommitData storage commit = playerCommits[msg.sender];

        // Check if player has committed data
        if (commit.commitBlock == 0) {
            revert ("No commit to reveal");
        }

        // Check if reveal block has been mined
        if (currentBlock <= commit.commitBlock) {
            revert("Reveal block not yet mined");
        }

        // Check if reveal is within the allowed window
        if (currentBlock > commit.commitBlock + commit.revealWindow) {
            revert("Reveal window expired");
        }

        // If a hash was committed, data must be provided and must match
        if (commit.committedHash != bytes32(0)) {
            if (data.length == 0) {
                revert("Invalid reveal");
            }
            bytes32 expectedHash = keccak256(abi.encodePacked(data, msg.sender));
            if (expectedHash != commit.committedHash) {
                revert("Invalid reveal");
            }
        }

        // Generate random number using entropy (same as reveal)
        randomNumber = _entropy(msg.sender, commit.commitBlock);
    }

    /// @notice Get commit details for a player
    /// @param player Player address
    /// @return committedHash Hash of committed data
    /// @return commitBlock Block when commit was made
    function getCommitDetails(address player) external view returns (
        bytes32 committedHash,
        uint256 commitBlock
    ) {
        CommitData storage commit = playerCommits[player];
        return (commit.committedHash, commit.commitBlock);
    }
} 