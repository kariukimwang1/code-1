// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title Staking
 * @dev Staking contract for MINER tokens with configurable APY and lock periods
 */
contract Staking is Ownable, ReentrancyGuard {
    IERC20 public minerToken;

    struct StakingPosition {
        uint256 amount;
        uint256 startTime;
        uint256 lockUntil;
        uint256 apy; // basis points (e.g., 1250 = 12.5%)
        uint256 rewardsEarned;
        bool active;
    }

    mapping(address => StakingPosition[]) public userStakes;
    mapping(address => uint256) public totalStaked;
    uint256 public totalSupplyStaked;

    uint256 public minStakeAmount = 100 * 10**18; // 100 MINER
    uint256 public constant BASIS_POINTS = 10000;

    event Staked(address indexed user, uint256 amount, uint256 lockDays, uint256 positionId);
    event Unstaked(address indexed user, uint256 amount, uint256 positionId);
    event RewardsClaimed(address indexed user, uint256 amount, uint256 positionId);

    constructor(address _minerToken, address initialOwner) Ownable(initialOwner) {
        minerToken = IERC20(_minerToken);
    }

    /**
     * @dev Stake tokens for a lock period
     * @param amount Amount to stake
     * @param lockDays Number of days to lock (0 = no lock, 30 = 30 days, 90 = 90 days)
     */
    function stake(uint256 amount, uint256 lockDays) external nonReentrant {
        require(amount >= minStakeAmount, "Amount below minimum");
        require(minerToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        uint256 lockUntil = lockDays > 0 ? block.timestamp + (lockDays * 1 days) : 0;
        uint256 apy = getAPYForLockPeriod(lockDays);

        StakingPosition memory position = StakingPosition({
            amount: amount,
            startTime: block.timestamp,
            lockUntil: lockUntil,
            apy: apy,
            rewardsEarned: 0,
            active: true
        });

        userStakes[msg.sender].push(position);
        totalStaked[msg.sender] += amount;
        totalSupplyStaked += amount;

        emit Staked(msg.sender, amount, lockDays, userStakes[msg.sender].length - 1);
    }

    /**
     * @dev Unstake tokens if lock period has passed
     */
    function unstake(uint256 positionId) external nonReentrant {
        require(positionId < userStakes[msg.sender].length, "Invalid position");
        StakingPosition storage position = userStakes[msg.sender][positionId];
        require(position.active, "Position not active");

        if (position.lockUntil > 0) {
            require(block.timestamp >= position.lockUntil, "Still locked");
        }

        uint256 amount = position.amount;
        position.active = false;

        totalStaked[msg.sender] -= amount;
        totalSupplyStaked -= amount;

        require(minerToken.transfer(msg.sender, amount), "Transfer failed");
        emit Unstaked(msg.sender, amount, positionId);
    }

    /**
     * @dev Claim accrued rewards
     */
    function claimRewards(uint256 positionId) external nonReentrant {
        require(positionId < userStakes[msg.sender].length, "Invalid position");
        StakingPosition storage position = userStakes[msg.sender][positionId];
        require(position.active, "Position not active");

        uint256 rewards = calculateRewards(msg.sender, positionId);
        require(rewards > 0, "No rewards to claim");

        position.rewardsEarned = 0;
        position.startTime = block.timestamp;

        require(minerToken.transfer(msg.sender, rewards), "Transfer failed");
        emit RewardsClaimed(msg.sender, rewards, positionId);
    }

    /**
     * @dev Calculate rewards for a staking position
     */
    function calculateRewards(address user, uint256 positionId) public view returns (uint256) {
        require(positionId < userStakes[user].length, "Invalid position");
        StakingPosition storage position = userStakes[user][positionId];
        require(position.active, "Position not active");

        uint256 timeStaked = block.timestamp - position.startTime;
        uint256 yearInSeconds = 365 * 24 * 60 * 60;
        uint256 rewards = (position.amount * position.apy * timeStaked) / (yearInSeconds * BASIS_POINTS);

        return rewards;
    }

    /**
     * @dev Get APY based on lock period
     */
    function getAPYForLockPeriod(uint256 lockDays) public pure returns (uint256) {
        if (lockDays >= 90) return 2500; // 25%
        if (lockDays >= 30) return 1500; // 15%
        return 500; // 5% for flexible/no lock
    }

    /**
     * @dev Get user's total staked amount
     */
    function getUserStakedAmount(address user) external view returns (uint256) {
        return totalStaked[user];
    }

    /**
     * @dev Get user's staking positions
     */
    function getUserStakes(address user) external view returns (StakingPosition[] memory) {
        return userStakes[user];
    }
}
