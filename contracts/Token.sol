// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

/**
 * @title MINER Token
 * @dev ERC20 token for the token/reward dApp platform
 * Total supply: 1,000,000,000 MINER
 */
contract MinerToken is ERC20, ERC20Burnable, Ownable {
    uint256 public constant INITIAL_SUPPLY = 1_000_000_000 * 10**18;
    
    // Allocation percentages (basis points)
    uint256 public constant REWARDS_POOL = 5000; // 50%
    uint256 public constant TEAM_FUND = 1500; // 15%
    uint256 public constant LIQUIDITY = 1500; // 15%
    uint256 public constant TREASURY = 1000; // 10%
    uint256 public constant MARKETING = 1000; // 10%

    address public rewardDistributor;
    address public stakingContract;

    event RewardDistributorSet(address indexed newDistributor);
    event StakingContractSet(address indexed newStaking);

    constructor(address initialOwner) ERC20("MINER", "MINER") Ownable(initialOwner) {
        // Mint initial supply
        _mint(initialOwner, INITIAL_SUPPLY);
    }

    /**
     * @dev Set the reward distributor contract
     */
    function setRewardDistributor(address _rewardDistributor) external onlyOwner {
        require(_rewardDistributor != address(0), "Invalid address");
        rewardDistributor = _rewardDistributor;
        emit RewardDistributorSet(_rewardDistributor);
    }

    /**
     * @dev Set the staking contract
     */
    function setStakingContract(address _stakingContract) external onlyOwner {
        require(_stakingContract != address(0), "Invalid address");
        stakingContract = _stakingContract;
        emit StakingContractSet(_stakingContract);
    }

    /**
     * @dev Mint tokens (only from authorized contracts)
     */
    function mint(address to, uint256 amount) external {
        require(
            msg.sender == rewardDistributor || msg.sender == owner(),
            "Unauthorized"
        );
        _mint(to, amount);
    }
}
