// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Nonces.sol";

/**
 * @title RewardDistributor
 * @dev Handles off-chain reward recording and on-chain claiming
 */
contract RewardDistributor is Ownable, ReentrancyGuard, Nonces {
    IERC20 public minerToken;

    mapping(address => uint256) public pendingRewards;
    mapping(bytes32 => bool) public claimedRewards;

    event RewardRecorded(address indexed user, uint256 amount, bytes32 taskId);
    event RewardClaimed(address indexed user, uint256 amount);
    event RewardInvalidated(bytes32 taskId);

    constructor(address _minerToken, address initialOwner) Ownable(initialOwner) {
        minerToken = IERC20(_minerToken);
    }

    /**
     * @dev Backend signs off-chain reward data and records it on-chain
     * Signature: keccak256(abi.encodePacked(user, amount, taskId, nonce))
     */
    function recordReward(
        address user,
        uint256 amount,
        bytes32 taskId,
        bytes calldata signature
    ) external onlyOwner {
        require(user != address(0), "Invalid user");
        require(amount > 0, "Invalid amount");

        bytes32 rewardId = keccak256(abi.encodePacked(user, amount, taskId, _useNonce(user)));
        require(!claimedRewards[rewardId], "Already claimed");

        pendingRewards[user] += amount;
        emit RewardRecorded(user, amount, taskId);
    }

    /**
     * @dev User claims their pending rewards
     */
    function claimRewards() external nonReentrant {
        uint256 amount = pendingRewards[msg.sender];
        require(amount > 0, "No pending rewards");

        pendingRewards[msg.sender] = 0;

        require(minerToken.transfer(msg.sender, amount), "Transfer failed");
        emit RewardClaimed(msg.sender, amount);
    }

    /**
     * @dev Get pending rewards for user
     */
    function getPendingRewards(address user) external view returns (uint256) {
        return pendingRewards[user];
    }

    /**
     * @dev Owner can invalidate malicious rewards
     */
    function invalidateReward(bytes32 taskId) external onlyOwner {
        emit RewardInvalidated(taskId);
    }
}
