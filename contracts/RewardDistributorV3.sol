pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract RewardDistributorV3 is Ownable, AccessControl, ReentrancyGuard {
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    
    IERC20 public token;
    
    uint256 public dailyRewardPool;
    uint256 public totalDistributed;
    
    struct RewardRecord {
        address user;
        uint256 amount;
        uint256 timestamp;
        bool claimed;
    }
    
    mapping(bytes32 => RewardRecord) public rewards;
    mapping(address => uint256) public userTotalRewards;
    
    event RewardRecorded(bytes32 indexed rewardId, address indexed user, uint256 amount);
    event RewardClaimed(bytes32 indexed rewardId, address indexed user, uint256 amount);

    constructor(address _token, address _oracle) {
        token = IERC20(_token);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ORACLE_ROLE, _oracle);
    }

    function recordReward(
        bytes32 rewardId,
        address user,
        uint256 amount,
        bytes calldata signature
    ) external onlyRole(ORACLE_ROLE) nonReentrant {
        require(user != address(0), "Invalid user");
        require(amount > 0, "Invalid amount");
        require(rewards[rewardId].user == address(0), "Reward already exists");

        // Verify signature from oracle
        require(_verifySignature(rewardId, user, amount, signature), "Invalid signature");

        rewards[rewardId] = RewardRecord({
            user: user,
            amount: amount,
            timestamp: block.timestamp,
            claimed: false
        });

        userTotalRewards[user] += amount;
        emit RewardRecorded(rewardId, user, amount);
    }

    function claimReward(bytes32 rewardId) external nonReentrant {
        RewardRecord storage reward = rewards[rewardId];
        require(reward.user == msg.sender, "Not your reward");
        require(!reward.claimed, "Already claimed");
        require(reward.amount > 0, "Invalid reward");

        reward.claimed = true;
        totalDistributed += reward.amount;

        require(token.transfer(msg.sender, reward.amount), "Transfer failed");
        emit RewardClaimed(rewardId, msg.sender, reward.amount);
    }

    function setDailyRewardPool(uint256 amount) external onlyOwner {
        dailyRewardPool = amount;
    }

    function _verifySignature(
        bytes32 rewardId,
        address user,
        uint256 amount,
        bytes calldata signature
    ) private view returns (bool) {
        // In production, implement proper signature verification
        return true;
    }

    function fundDistributor(uint256 amount) external onlyOwner {
        require(token.transferFrom(msg.sender, address(this), amount), "Transfer failed");
    }

    function getUserRewards(address user) external view returns (uint256) {
        return userTotalRewards[user];
    }
}
