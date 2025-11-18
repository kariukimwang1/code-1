// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title Staking
 * @dev Flexible staking with lock periods and variable APY rewards
 * Includes mining multiplier boost for active stakeholders
 */
contract Staking is Ownable, ReentrancyGuard {
    IERC20 public token;
    
    // Staking tiers with lock periods and APY
    struct StakingTier {
        uint256 lockDays;
        uint256 apyBps; // basis points (5000 = 5%)
        uint256 miningMultiplier; // 10000 = 1x, 15000 = 1.5x
    }
    
    StakingTier[] public tiers;
    
    // User staking position
    struct StakingPosition {
        uint256 amount;
        uint256 tierId;
        uint256 startTime;
        uint256 lastClaimTime;
        uint256 rewardsClaimed;
    }
    
    mapping(address => StakingPosition[]) public userPositions;
    mapping(address => uint256) public totalStaked;
    mapping(address => uint256) public miningMultiplier; // Per user average
    
    uint256 public totalPoolStaked;
    address public rewardDistributor;
    
    event Staked(address indexed user, uint256 amount, uint256 tierId, uint256 positionId);
    event Unstaked(address indexed user, uint256 amount, uint256 rewardsClaimed);
    event RewardsClaimed(address indexed user, uint256 amount);
    event TierCreated(uint256 indexed tierId, uint256 lockDays, uint256 apyBps, uint256 multiplier);

    constructor(address _token, address _rewardDistributor) Ownable(msg.sender) {
        token = IERC20(_token);
        rewardDistributor = _rewardDistributor;
        
        // Create default tiers
        _addTier(0, 500, 10000);    // Flexible: 0 days, 5% APY, 1x multiplier
        _addTier(30, 1000, 12000);  // 30-day: 30 days, 10% APY, 1.2x multiplier
        _addTier(90, 2500, 15000);  // 90-day: 90 days, 25% APY, 1.5x multiplier
    }

    function _addTier(uint256 lockDays, uint256 apyBps, uint256 multiplier) internal {
        tiers.push(StakingTier(lockDays, apyBps, multiplier));
    }

    function addTier(uint256 lockDays, uint256 apyBps, uint256 multiplier) external onlyOwner {
        require(apyBps <= 10000, "APY too high"); // Max 100%
        require(multiplier >= 10000 && multiplier <= 30000, "Invalid multiplier");
        _addTier(lockDays, apyBps, multiplier);
        emit TierCreated(tiers.length - 1, lockDays, apyBps, multiplier);
    }

    function stake(uint256 amount, uint256 tierId) external nonReentrant {
        require(amount > 0, "Invalid amount");
        require(tierId < tiers.length, "Invalid tier");
        
        require(token.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        userPositions[msg.sender].push(StakingPosition(
            amount,
            tierId,
            block.timestamp,
            block.timestamp,
            0
        ));
        
        totalStaked[msg.sender] += amount;
        totalPoolStaked += amount;
        
        _updateMiningMultiplier(msg.sender);
        emit Staked(msg.sender, amount, tierId, userPositions[msg.sender].length - 1);
    }

    function unstake(uint256 positionId) external nonReentrant {
        require(positionId < userPositions[msg.sender].length, "Invalid position");
        
        StakingPosition storage pos = userPositions[msg.sender][positionId];
        StakingTier memory tier = tiers[pos.tierId];
        
        uint256 lockExpiry = pos.startTime + (tier.lockDays * 1 days);
        require(block.timestamp >= lockExpiry, "Still locked");
        
        uint256 rewards = calculateRewards(msg.sender, positionId);
        uint256 totalReturn = pos.amount + rewards;
        
        totalStaked[msg.sender] -= pos.amount;
        totalPoolStaked -= pos.amount;
        
        pos.amount = 0;
        pos.rewardsClaimed += rewards;
        
        require(token.transfer(msg.sender, totalReturn), "Transfer failed");
        
        _updateMiningMultiplier(msg.sender);
        emit Unstaked(msg.sender, pos.amount, rewards);
    }

    function claimRewards(uint256 positionId) external nonReentrant {
        require(positionId < userPositions[msg.sender].length, "Invalid position");
        
        uint256 rewards = calculateRewards(msg.sender, positionId);
        require(rewards > 0, "No rewards");
        
        userPositions[msg.sender][positionId].lastClaimTime = block.timestamp;
        userPositions[msg.sender][positionId].rewardsClaimed += rewards;
        
        require(token.transfer(msg.sender, rewards), "Transfer failed");
        emit RewardsClaimed(msg.sender, rewards);
    }

    function calculateRewards(address user, uint256 positionId) public view returns (uint256) {
        require(positionId < userPositions[user].length, "Invalid position");
        
        StakingPosition memory pos = userPositions[user][positionId];
        StakingTier memory tier = tiers[pos.tierId];
        
        uint256 timeSinceLastClaim = block.timestamp - pos.lastClaimTime;
        uint256 yearlyRewards = (pos.amount * tier.apyBps) / 10000;
        uint256 rewards = (yearlyRewards * timeSinceLastClaim) / 365 days;
        
        return rewards;
    }

    function _updateMiningMultiplier(address user) internal {
        uint256 totalAmount = totalStaked[user];
        if (totalAmount == 0) {
            miningMultiplier[user] = 10000;
            return;
        }
        
        uint256 weightedMultiplier = 0;
        for (uint256 i = 0; i < userPositions[user].length; i++) {
            if (userPositions[user][i].amount > 0) {
                uint256 weight = (userPositions[user][i].amount * 10000) / totalAmount;
                weightedMultiplier += (weight * tiers[userPositions[user][i].tierId].miningMultiplier) / 10000;
            }
        }
        
        miningMultiplier[user] = weightedMultiplier > 0 ? weightedMultiplier : 10000;
    }

    function getUserPositions(address user) external view returns (StakingPosition[] memory) {
        return userPositions[user];
    }

    function getTierCount() external view returns (uint256) {
        return tiers.length;
    }

    function getTier(uint256 tierId) external view returns (StakingTier memory) {
        require(tierId < tiers.length, "Invalid tier");
        return tiers[tierId];
    }
}
