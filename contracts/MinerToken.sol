// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";

/**
 * @title MINER Token
 * @dev ERC20 token (1B total) with burn, owner controls, and thirdweb compatibility
 * Designed for token/reward dApp platform with Proof of Contribution mining
 */
contract MinerToken is ERC20, ERC20Burnable, ERC20Capped, Ownable {
    uint256 public constant INITIAL_SUPPLY = 1_000_000_000 * 10**18;
    
    // Allocation percentages (basis points = 10000 = 100%)
    uint256 public constant REWARDS_POOL_BPS = 5000; // 50%
    uint256 public constant TEAM_FUND_BPS = 1500; // 15%
    uint256 public constant LIQUIDITY_BPS = 1500; // 15%
    uint256 public constant TREASURY_BPS = 1000; // 10%
    uint256 public constant MARKETING_BPS = 1000; // 10%

    address public rewardDistributor;
    address public stakingContract;
    mapping(address => bool) public authorized;

    event RewardDistributorSet(address indexed newDistributor);
    event StakingContractSet(address indexed newStaking);
    event AuthorizedChanged(address indexed account, bool status);

    constructor(address initialOwner) 
        ERC20("MINER", "MINER") 
        ERC20Capped(INITIAL_SUPPLY)
        Ownable(initialOwner) 
    {
        _mint(initialOwner, INITIAL_SUPPLY);
    }

    function setRewardDistributor(address _rewardDistributor) external onlyOwner {
        require(_rewardDistributor != address(0), "Invalid address");
        rewardDistributor = _rewardDistributor;
        authorized[_rewardDistributor] = true;
        emit RewardDistributorSet(_rewardDistributor);
    }

    function setStakingContract(address _stakingContract) external onlyOwner {
        require(_stakingContract != address(0), "Invalid address");
        stakingContract = _stakingContract;
        authorized[_stakingContract] = true;
        emit StakingContractSet(_stakingContract);
    }

    function setAuthorized(address account, bool status) external onlyOwner {
        authorized[account] = status;
        emit AuthorizedChanged(account, status);
    }

    function mint(address to, uint256 amount) external {
        require(authorized[msg.sender], "Unauthorized mint");
        require(totalSupply() + amount <= cap(), "Cap exceeded");
        _mint(to, amount);
    }

    function _update(address from, address to, uint256 amount) 
        internal 
        override(ERC20, ERC20Capped) 
    {
        super._update(from, to, amount);
    }

    function _mint(address account, uint256 amount) 
        internal 
        override(ERC20, ERC20Capped) 
    {
        super._mint(account, amount);
    }
}
