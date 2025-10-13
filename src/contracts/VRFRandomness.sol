// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/ConfirmedOwner.sol";

/// @title VRFRandomness
/// @notice Provides cryptographically secure random numbers using Chainlink VRF v2
/// @dev Maximum security randomness - suitable for high-stakes applications
contract VRFRandomness is VRFConsumerBaseV2, ConfirmedOwner {
    
    /// @notice VRF Coordinator interface
    VRFCoordinatorV2Interface private immutable vrfCoordinator;
    
    /// @notice VRF subscription ID
    uint64 private subscriptionId;
    
    /// @notice VRF key hash (gas lane)
    bytes32 private keyHash;
    
    /// @notice VRF callback gas limit
    uint32 private callbackGasLimit = 100000;
    
    /// @notice VRF confirmations to wait
    uint16 private requestConfirmations = 3;
    
    /// @notice Number of random values to request
    uint32 private numWords = 1;
    
    /// @notice Request ID counter
    uint256 private requestCounter;
    
    /// @notice Random request data
    struct RandomRequest {
        address requester;
        bool fulfilled;
        uint256 randomResult;
        uint256 timestamp;
        bytes32 purpose; // What the randomness is for
    }
    
    /// @notice Mapping from request ID to request data
    mapping(uint256 => RandomRequest) public requests;
    
    /// @notice Mapping from user to their latest request ID
    mapping(address => uint256) public userLatestRequest;
    
    /// @notice Emitted when randomness is requested
    event RandomnessRequested(
        uint256 indexed requestId,
        address indexed requester,
        bytes32 purpose
    );
    
    /// @notice Emitted when randomness is fulfilled
    event RandomnessFulfilled(
        uint256 indexed requestId,
        address indexed requester,
        uint256 randomResult
    );
    
    /// @notice Error when request doesn't exist or not fulfilled
    error RequestNotFulfilled(uint256 requestId);
    
    /// @notice Error when user has no fulfilled requests
    error NoRandomnessAvailable();
    
    /// @notice Error when VRF subscription is not set
    error SubscriptionNotSet();
    
    /// @param vrfCoordinatorAddress VRF Coordinator contract address
    /// @param subscriptionId_ VRF subscription ID
    /// @param keyHash_ VRF key hash for gas lane
    constructor(
        address vrfCoordinatorAddress,
        uint64 subscriptionId_,
        bytes32 keyHash_
    ) VRFConsumerBaseV2(vrfCoordinatorAddress) ConfirmedOwner(msg.sender) {
        vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorAddress);
        subscriptionId = subscriptionId_;
        keyHash = keyHash_;
    }
    
    /// @notice Request randomness for a specific purpose
    /// @param purpose Description of what randomness is for
    /// @return requestId The VRF request ID
    function requestRandomness(bytes32 purpose) external returns (uint256 requestId) {
        if (subscriptionId == 0) {
            revert SubscriptionNotSet();
        }
        
        // Request randomness from VRF
        requestId = vrfCoordinator.requestRandomWords(
            keyHash,
            subscriptionId,
            requestConfirmations,
            callbackGasLimit,
            numWords
        );
        
        // Store request data
        requests[requestId] = RandomRequest({
            requester: msg.sender,
            fulfilled: false,
            randomResult: 0,
            timestamp: block.timestamp,
            purpose: purpose
        });
        
        // Update user's latest request
        userLatestRequest[msg.sender] = requestId;
        requestCounter++;
        
        emit RandomnessRequested(requestId, msg.sender, purpose);
    }
    
    /// @notice Request randomness without specific purpose
    /// @return requestId The VRF request ID
    function requestRandomness() external returns (uint256 requestId) {
        return requestRandomness(bytes32("general"));
    }
    
    /// @notice VRF callback function - called by Chainlink VRF
    /// @param requestId The request ID
    /// @param randomWords Array of random words from VRF
    function fulfillRandomWords(
        uint256 requestId,
        uint256[] memory randomWords
    ) internal override {
        RandomRequest storage request = requests[requestId];
        require(request.requester != address(0), "Request not found");
        
        // Store the random result
        request.fulfilled = true;
        request.randomResult = randomWords[0];
        
        emit RandomnessFulfilled(requestId, request.requester, randomWords[0]);
    }
    
    /// @notice Get randomness result for a specific request
    /// @param requestId The request ID
    /// @return randomResult The random number (reverts if not fulfilled)
    function getRandomResult(uint256 requestId) external view returns (uint256 randomResult) {
        RandomRequest memory request = requests[requestId];
        if (!request.fulfilled) {
            revert RequestNotFulfilled(requestId);
        }
        return request.randomResult;
    }
    
    /// @notice Get user's latest randomness result
    /// @return randomResult The random number from user's latest request
    function getMyLatestRandom() external view returns (uint256 randomResult) {
        uint256 requestId = userLatestRequest[msg.sender];
        if (requestId == 0) {
            revert NoRandomnessAvailable();
        }
        return this.getRandomResult(requestId);
    }
    
    /// @notice Check if a request is fulfilled
    /// @param requestId The request ID
    /// @return fulfilled Whether the request is fulfilled
    function isRequestFulfilled(uint256 requestId) external view returns (bool fulfilled) {
        return requests[requestId].fulfilled;
    }
    
    /// @notice Get random number in range [1, max] from latest request
    /// @param max Maximum value (inclusive)
    /// @return Random number between 1 and max
    function getRandomInRange(uint256 max) external view returns (uint256) {
        require(max > 0, "Max must be positive");
        uint256 randomNumber = this.getMyLatestRandom();
        return (randomNumber % max) + 1;
    }
    
    /// @notice Get random boolean from latest request
    /// @return Random boolean
    function getRandomBool() external view returns (bool) {
        uint256 randomNumber = this.getMyLatestRandom();
        return (randomNumber % 2) == 1;
    }
    
    /// @notice Get multiple random numbers from single VRF result
    /// @param count Number of random numbers to generate
    /// @return randomNumbers Array of random numbers
    function getMultipleRandom(uint256 count) external view returns (uint256[] memory randomNumbers) {
        require(count > 0 && count <= 50, "Count must be 1-50");
        
        uint256 baseRandom = this.getMyLatestRandom();
        randomNumbers = new uint256[](count);
        
        for (uint256 i = 0; i < count; i++) {
            randomNumbers[i] = uint256(keccak256(abi.encodePacked(
                baseRandom,
                i,
                msg.sender,
                block.chainid
            )));
        }
    }
    
    /// @notice Get request details
    /// @param requestId The request ID
    /// @return requester Address that made the request
    /// @return fulfilled Whether request is fulfilled
    /// @return randomResult The random result (0 if not fulfilled)
    /// @return timestamp When request was made
    /// @return purpose Purpose of the request
    function getRequestDetails(uint256 requestId) 
        external 
        view 
        returns (
            address requester,
            bool fulfilled,
            uint256 randomResult,
            uint256 timestamp,
            bytes32 purpose
        ) 
    {
        RandomRequest memory request = requests[requestId];
        return (
            request.requester,
            request.fulfilled,
            request.randomResult,
            request.timestamp,
            request.purpose
        );
    }
    
    /// @notice Update VRF configuration (owner only)
    /// @param newSubscriptionId New subscription ID
    /// @param newKeyHash New key hash
    /// @param newCallbackGasLimit New callback gas limit
    function updateVRFConfig(
        uint64 newSubscriptionId,
        bytes32 newKeyHash,
        uint32 newCallbackGasLimit
    ) external onlyOwner {
        subscriptionId = newSubscriptionId;
        keyHash = newKeyHash;
        callbackGasLimit = newCallbackGasLimit;
    }
    
    /// @notice Get current VRF configuration
    /// @return currentSubscriptionId Current subscription ID
    /// @return currentKeyHash Current key hash
    /// @return currentCallbackGasLimit Current callback gas limit
    /// @return currentRequestConfirmations Current confirmations needed
    function getVRFConfig() 
        external 
        view 
        returns (
            uint64 currentSubscriptionId,
            bytes32 currentKeyHash,
            uint32 currentCallbackGasLimit,
            uint16 currentRequestConfirmations
        ) 
    {
        return (subscriptionId, keyHash, callbackGasLimit, requestConfirmations);
    }
    
    /// @notice Get total number of requests made
    /// @return count Total request count
    function getTotalRequests() external view returns (uint256 count) {
        return requestCounter;
    }
} 