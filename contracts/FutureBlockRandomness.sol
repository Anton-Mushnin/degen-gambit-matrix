// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @title FutureBlockRandomness
/// @notice Provides secure random numbers using future block hash approach without betting logic
/// @dev Uses future block hash approach - request random number, wait, then draw result
contract FutureBlockRandomness {
    
    /// @notice Number of blocks to wait before drawing result
    uint256 public constant DRAW_DELAY = 3;
    
    /// @notice Block hash expiry window (EVM limitation)
    uint256 public constant DRAW_WINDOW = 256;
    
    /// @notice Player's current randomness request
    struct RandomRequest {
        bool hasActiveRequest;  // Whether player has a pending request
        bytes32 requestData;    // Encoded request parameters (seed, nonce, etc.)
        uint256 requestBlock;   // Block when request was made
        uint256 drawBlock;      // Block when result can be drawn
    }
    
    /// @notice Mapping from player address to their current request
    mapping(address => RandomRequest) public randomRequests;
    
    /// @notice Emitted when a player requests random number
    event RandomRequested(
        address indexed player,
        uint256 requestBlock,
        uint256 drawBlock
    );
    
    /// @notice Emitted when a random number is drawn
    event RandomDrawn(
        address indexed player,
        uint256 randomNumber
    );
    
    /// @notice Emitted when a request expires without being drawn
    event RequestExpired(address indexed player);
    
    /// @notice Error when player already has an active request
    error RequestAlreadyActive();
    
    /// @notice Error when player has no active request to draw
    error NoRequestToDraw();
    
    /// @notice Error when trying to draw too early
    error DrawTooEarly(uint256 currentBlock, uint256 drawBlock);
    
    /// @notice Error when draw window has expired
    error DrawWindowExpired(uint256 currentBlock, uint256 expiryBlock);
    
    /// @notice Request a random number with optional seed data
    /// @param seedData Optional seed data for additional entropy
    function requestRandom(bytes32 seedData) external virtual {
        _requestRandom(seedData);
    }
    
    /// @notice Request random number without seed data
    function requestRandom() external {
        _requestRandom(bytes32(0));
    }
    
    /// @notice Internal function to request random number
    /// @param seedData Optional seed data for additional entropy
    function _requestRandom(bytes32 seedData) internal virtual {
        RandomRequest storage request = randomRequests[msg.sender];
        
        // Check if player already has an active request
        if (request.hasActiveRequest) {
            revert RequestAlreadyActive();
        }
        
        // Calculate draw block
        uint256 drawBlock = block.number + DRAW_DELAY;
        
        // Store request information
        request.hasActiveRequest = true;
        request.requestData = seedData;
        request.requestBlock = block.number;
        request.drawBlock = drawBlock;
        
        emit RandomRequested(msg.sender, block.number, drawBlock);
    }
    
    /// @notice Draw the random number result
    /// @return randomNumber The generated random number
    function drawRandom() external virtual returns (uint256 randomNumber) {
        return _drawRandom();
    }
    
    /// @notice Internal function to draw random number
    /// @return randomNumber The generated random number
    function _drawRandom() internal virtual returns (uint256 randomNumber) {
        RandomRequest storage request = randomRequests[msg.sender];
        
        // Check if player has an active request
        if (!request.hasActiveRequest) {
            revert NoRequestToDraw();
        }
        
        // Check if enough blocks have passed
        if (block.number < request.drawBlock) {
            revert DrawTooEarly(block.number, request.drawBlock);
        }
        
        // Check if draw window hasn't expired
        uint256 expiryBlock = request.drawBlock + DRAW_WINDOW;
        if (block.number > expiryBlock) {
            // Request has expired - clear state
            _clearRequest(msg.sender);
            emit RequestExpired(msg.sender);
            revert DrawWindowExpired(block.number, expiryBlock);
        }
        
        // Generate secure random number
        randomNumber = _generateRandomNumber(request.drawBlock, request.requestData, msg.sender);
        
        // Clear request state
        _clearRequest(msg.sender);
        
        emit RandomDrawn(msg.sender, randomNumber);
    }
    
    /// @notice Check if a request can be drawn (is ready and not expired)
    /// @param player Player address to check
    /// @return canDraw Whether the request can be drawn
    /// @return blocksUntilReady Blocks until draw is ready (0 if ready)
    /// @return blocksUntilExpiry Blocks until draw expires
    function checkDrawStatus(address player) 
        external 
        view 
        returns (bool canDraw, uint256 blocksUntilReady, uint256 blocksUntilExpiry) 
    {
        RandomRequest storage request = randomRequests[player];
        
        if (!request.hasActiveRequest) {
            return (false, 0, 0);
        }
        
        uint256 currentBlock = block.number;
        uint256 expiryBlock = request.drawBlock + DRAW_WINDOW;
        
        if (currentBlock >= request.drawBlock && currentBlock <= expiryBlock) {
            canDraw = true;
            blocksUntilReady = 0;
        } else if (currentBlock < request.drawBlock) {
            canDraw = false;
            blocksUntilReady = request.drawBlock - currentBlock;
        } else {
            canDraw = false;
            blocksUntilReady = 0;
        }
        
        blocksUntilExpiry = currentBlock >= expiryBlock ? 0 : expiryBlock - currentBlock;
    }
    
    /// @notice Generate secure random number using future block hash
    /// @param targetBlock Block number to use for randomness
    /// @param seedData Seed data for additional entropy
    /// @param player Player address for additional entropy
    /// @return Random number
    function _generateRandomNumber(
        uint256 targetBlock,
        bytes32 seedData,
        address player
    ) internal view virtual returns (uint256) {
        bytes32 blockHash = blockhash(targetBlock);
        require(blockHash != bytes32(0), "Block hash not available");
        
        return uint256(keccak256(abi.encodePacked(
            blockHash,
            seedData,
            player,
            targetBlock
        )));
    }
    
    /// @notice Clear player's request state
    /// @param player Player address
    function _clearRequest(address player) internal {
        delete randomRequests[player];
    }
    
    /// @notice Get bounded random number in range [1, max]
    /// @param max Maximum value (inclusive)
    /// @return Random number between 1 and max
    function drawRandomInRange(uint256 max) external returns (uint256) {
        require(max > 0, "Max must be positive");
        uint256 randomNumber = this.drawRandom();
        return (randomNumber % max) + 1;
    }
    
    /// @notice Get random boolean (true/false)
    /// @return Random boolean
    function drawRandomBool() external returns (bool) {
        uint256 randomNumber = this.drawRandom();
        return (randomNumber % 2) == 1;
    }
    
    /// @notice Get multiple random numbers from single request
    /// @param count Number of random numbers to generate
    /// @return randomNumbers Array of random numbers
    function drawMultipleRandom(uint256 count) external returns (uint256[] memory randomNumbers) {
        require(count > 0 && count <= 32, "Count must be 1-32");
        
        uint256 baseRandom = this.drawRandom();
        randomNumbers = new uint256[](count);
        
        for (uint256 i = 0; i < count; i++) {
            randomNumbers[i] = uint256(keccak256(abi.encodePacked(baseRandom, i, msg.sender)));
        }
    }
} 