// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @title PastBlockRandomness
/// @notice Provides immediate random numbers using past block hashes
/// @dev Uses previous block hashes for instant randomness (trade-off: lower security)
contract PastBlockRandomness {
    
    /// @notice Nonce for additional entropy in repeated calls
    uint256 private globalNonce;
    
    /// @notice Per-user nonce for user-specific entropy
    mapping(address => uint256) private userNonces;
    
    /// @notice Emitted when random number is generated
    event RandomGenerated(
        address indexed user,
        uint256 randomNumber,
        uint8 method // 1=single, 2=multiple, 3=enhanced
    );
    
    /// @notice Generate random number using single past block hash
    /// @return randomNumber Generated random number
    function randomFromSingleBlock() external returns (uint256 randomNumber) {
        // Use previous block hash for immediate randomness
        randomNumber = uint256(keccak256(abi.encodePacked(
            blockhash(block.number - 1),
            msg.sender,
            block.timestamp,
            ++userNonces[msg.sender]
        )));
        
        emit RandomGenerated(msg.sender, randomNumber, 1);
    }
    
    /// @notice Generate random number using multiple past block hashes
    /// @param blockCount Number of past blocks to use (1-10)
    /// @return randomNumber Generated random number
    function randomFromMultipleBlocks(uint8 blockCount) external returns (uint256 randomNumber) {
        require(blockCount > 0 && blockCount <= 10, "Block count must be 1-10");
        
        bytes memory entropy = abi.encodePacked(msg.sender, block.timestamp);
        
        // Combine multiple past block hashes
        for (uint8 i = 1; i <= blockCount; i++) {
            if (block.number > i) {
                entropy = abi.encodePacked(entropy, blockhash(block.number - i));
            }
        }
        
        // Add nonces for uniqueness
        entropy = abi.encodePacked(
            entropy,
            ++globalNonce,
            ++userNonces[msg.sender]
        );
        
        randomNumber = uint256(keccak256(entropy));
        emit RandomGenerated(msg.sender, randomNumber, 2);
    }
    
    /// @notice Generate enhanced random number with maximum available entropy
    /// @return randomNumber Generated random number
    function randomEnhanced() external returns (uint256 randomNumber) {
        // Combine all available on-chain entropy sources
        randomNumber = uint256(keccak256(abi.encodePacked(
            // Block-based entropy
            blockhash(block.number - 1),
            blockhash(block.number - 2),
            blockhash(block.number - 3),
            block.timestamp,
            block.difficulty,
            block.coinbase,
            
            // Transaction-based entropy
            msg.sender,
            tx.origin,
            tx.gasprice,
            gasleft(),
            
            // Contract-based entropy
            address(this),
            address(this).balance,
            
            // Nonces for uniqueness
            ++globalNonce,
            ++userNonces[msg.sender]
        )));
        
        emit RandomGenerated(msg.sender, randomNumber, 3);
    }
    
    /// @notice Get random number in range [1, max] using single block
    /// @param max Maximum value (inclusive)
    /// @return Random number between 1 and max
    function randomInRange(uint256 max) external returns (uint256) {
        require(max > 0, "Max must be positive");
        uint256 randomNumber = this.randomFromSingleBlock();
        return (randomNumber % max) + 1;
    }
    
    /// @notice Get random boolean using single block
    /// @return Random boolean
    function randomBool() external returns (bool) {
        uint256 randomNumber = this.randomFromSingleBlock();
        return (randomNumber % 2) == 1;
    }
    
    /// @notice Get multiple random numbers using enhanced method
    /// @param count Number of random numbers to generate (1-20)
    /// @return randomNumbers Array of random numbers
    function randomMultiple(uint256 count) external returns (uint256[] memory randomNumbers) {
        require(count > 0 && count <= 20, "Count must be 1-20");
        
        uint256 baseRandom = this.randomEnhanced();
        randomNumbers = new uint256[](count);
        
        for (uint256 i = 0; i < count; i++) {
            randomNumbers[i] = uint256(keccak256(abi.encodePacked(
                baseRandom,
                i,
                block.timestamp,
                msg.sender
            )));
        }
    }
    
    /// @notice Get shuffled array using multiple blocks method
    /// @param size Size of array to shuffle (1-52)
    /// @return shuffled Array of shuffled indices [0, 1, 2, ...]
    function randomShuffle(uint256 size) external returns (uint256[] memory shuffled) {
        require(size > 0 && size <= 52, "Size must be 1-52");
        
        // Initialize array [0, 1, 2, ..., size-1]
        shuffled = new uint256[](size);
        for (uint256 i = 0; i < size; i++) {
            shuffled[i] = i;
        }
        
        // Fisher-Yates shuffle using multiple blocks entropy
        uint256 baseRandom = this.randomFromMultipleBlocks(5);
        
        for (uint256 i = size - 1; i > 0; i--) {
            uint256 entropy = uint256(keccak256(abi.encodePacked(baseRandom, i, msg.sender)));
            uint256 j = entropy % (i + 1);
            
            // Swap shuffled[i] and shuffled[j]
            (shuffled[i], shuffled[j]) = (shuffled[j], shuffled[i]);
        }
    }
    
    /// @notice Check quality of randomness for current block
    /// @return singleQuality Quality using single block (higher = better)
    /// @return multipleQuality Quality using 5 blocks (higher = better)
    /// @return recommendation Recommended method (1=single, 2=multiple, 3=enhanced)
    function assessRandomnessQuality() 
        external 
        view 
        returns (uint256 singleQuality, uint256 multipleQuality, uint8 recommendation) 
    {
        // Assess single block quality
        bytes32 lastBlock = blockhash(block.number - 1);
        singleQuality = lastBlock != bytes32(0) ? 1 : 0;
        
        // Assess multiple blocks quality
        uint256 availableBlocks = 0;
        for (uint8 i = 1; i <= 5; i++) {
            if (block.number > i && blockhash(block.number - i) != bytes32(0)) {
                availableBlocks++;
            }
        }
        multipleQuality = availableBlocks;
        
        // Recommend method based on available entropy
        if (availableBlocks >= 3) {
            recommendation = 3; // Enhanced
        } else if (availableBlocks >= 2) {
            recommendation = 2; // Multiple
        } else {
            recommendation = 1; // Single
        }
    }
    
    /// @notice Get user's current nonce
    /// @param user User address
    /// @return nonce Current nonce for user
    function getUserNonce(address user) external view returns (uint256 nonce) {
        return userNonces[user];
    }
    
    /// @notice Get global nonce
    /// @return nonce Current global nonce
    function getGlobalNonce() external view returns (uint256 nonce) {
        return globalNonce;
    }
} 