// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title RewardDistributor
 * @dev Distributes verified rewards from backend oracle to users on-chain
 * Includes batch processing, rate limits, and audit trails
 */
contract RewardDistributor is Ownable, ReentrancyGuard {
    IERC20 public token;
    
    // Reward configuration
    uint256 public dailyEmissionCap = 500_000 * 10**18;
    uint256 public lastResetTime;
    uint256 public dailyEmitted;
    
    // Oracle configuration
    address public oracle;
    uint256 public oracleNonce;
    mapping(uint256 => bool) public usedNonces;
    
    // User rewards tracking
    struct RewardClaim {
        address user;
        uint256 amount;
        bytes32 taskHash;
        uint256 timestamp;
    }
    
    mapping(bytes32 => RewardClaim) public claims;
    mapping(address => uint256) public userClaimedTotal;
    
    // Batch processing
    struct BatchInfo {
        uint256 batchId;
        uint256 totalAmount;
        uint256 processingTime;
        bool processed;
    }
    
    mapping(uint256 => BatchInfo) public batches;
    uint256 public batchCounter;
    
    // Fee configuration for treasury
    uint256 public treasuryFeeBps = 200; // 2%
    address public treasury;
    
    event RewardClaimed(address indexed user, uint256 amount, bytes32 taskHash);
    event BatchProcessed(uint256 indexed batchId, uint256 totalAmount, uint256 claimCount);
    event DailyCapExceeded(uint256 requested, uint256 available);
    event OracleUpdated(address newOracle);
    event TreasuryFeeUpdated(uint256 newFeeBps);

    constructor(address _token, address _oracle, address _treasury) Ownable(msg.sender) {
        token = IERC20(_token);
        oracle = _oracle;
        treasury = _treasury;
        lastResetTime = block.timestamp;
    }

    modifier onlyOracle() {
        require(msg.sender == oracle, "Only oracle");
        reachReached();
    }

    modifier reachReached() {
        if (block.timestamp >= lastResetTime + 1 days) {
            dailyEmitted = 0;
            lastResetTime = block.timestamp;
        }
        _;
    }

    function claimReward(
        address user,
        uint256 amount,
        bytes32 taskHash,
        uint256 nonce,
        bytes calldata signature
    ) external nonReentrant {
        require(amount > 0, "Invalid amount");
        require(user != address(0), "Invalid user");
        require(!usedNonces[nonce], "Nonce used");
        
        // Verify signature from oracle
        bytes32 messageHash = keccak256(abi.encodePacked(user, amount, taskHash, nonce));
        bytes32 ethSignedHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
        require(recoverSigner(ethSignedHash, signature) == oracle, "Invalid signature");
        
        usedNonces[nonce] = true;
        
        // Check daily cap
        if (dailyEmitted + amount > dailyEmissionCap) {
            uint256 available = dailyEmissionCap - dailyEmitted;
            emit DailyCapExceeded(amount, available);
            return;
        }
        
        dailyEmitted += amount;
        
        // Store claim
        bytes32 claimId = keccak256(abi.encodePacked(user, taskHash, block.timestamp));
        claims[claimId] = RewardClaim(user, amount, taskHash, block.timestamp);
        userClaimedTotal[user] += amount;
        
        // Deduct treasury fee
        uint256 treasuryFee = (amount * treasuryFeeBps) / 10000;
        uint256 userAmount = amount - treasuryFee;
        
        // Transfer tokens
        require(token.transfer(user, userAmount), "Transfer failed");
        if (treasuryFee > 0) {
            require(token.transfer(treasury, treasuryFee), "Treasury transfer failed");
        }
        
        emit RewardClaimed(user, userAmount, taskHash);
    }

    function processBatch(
        address[] calldata users,
        uint256[] calldata amounts,
        bytes32[] calldata taskHashes,
        bytes calldata signature
    ) external onlyOracle nonReentrant {
        require(users.length == amounts.length, "Length mismatch");
        require(amounts.length == taskHashes.length, "Length mismatch");
        
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalAmount += amounts[i];
        }
        
        require(totalAmount > 0, "Invalid batch");
        require(dailyEmitted + totalAmount <= dailyEmissionCap, "Exceeds daily cap");
        
        dailyEmitted += totalAmount;
        uint256 batchId = ++batchCounter;
        
        for (uint256 i = 0; i < users.length; i++) {
            uint256 treasuryFee = (amounts[i] * treasuryFeeBps) / 10000;
            uint256 userAmount = amounts[i] - treasuryFee;
            
            require(token.transfer(users[i], userAmount), "Transfer failed");
            if (treasuryFee > 0) {
                require(token.transfer(treasury, treasuryFee), "Treasury transfer failed");
            }
            
            userClaimedTotal[users[i]] += userAmount;
        }
        
        batches[batchId] = BatchInfo(batchId, totalAmount, block.timestamp, true);
        emit BatchProcessed(batchId, totalAmount, users.length);
    }

    function setOracle(address _oracle) external onlyOwner {
        require(_oracle != address(0), "Invalid oracle");
        oracle = _oracle;
        emit OracleUpdated(_oracle);
    }

    function setDailyEmissionCap(uint256 _cap) external onlyOwner {
        dailyEmissionCap = _cap;
    }

    function setTreasuryFee(uint256 _feeBps) external onlyOwner {
        require(_feeBps <= 1000, "Fee too high"); // Max 10%
        treasuryFeeBps = _feeBps;
        emit TreasuryFeeUpdated(_feeBps);
    }

    function recoverSigner(bytes32 digest, bytes calldata signature) 
        internal 
        pure 
        returns (address) 
    {
        require(signature.length == 65, "Invalid signature");
        
        bytes32 r;
        bytes32 s;
        uint8 v;
        
        assembly {
            r := calldataload(signature.offset)
            s := calldataload(add(signature.offset, 32))
            v := byte(0, calldataload(add(signature.offset, 64)))
        }
        
        return ecrecover(digest, v, r, s);
    }

    function withdrawTokens(uint256 amount) external onlyOwner {
        require(token.transfer(msg.sender, amount), "Transfer failed");
    }
}
