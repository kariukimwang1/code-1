// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Treasury
 * @dev Manages buyback and LP provision for token stability
 */
contract Treasury is Ownable {
    IERC20 public token;
    address public usdcToken;
    
    uint256 public buybackBudgetBps = 500; // 5% of fees go to buyback
    uint256 public lpProvisionBps = 300; // 3% for LP
    
    uint256 public totalBuyback;
    uint256 public totalBurned;
    
    event BuybackExecuted(uint256 tokensBurned, uint256 usdcSpent);
    event LiquidityProvided(uint256 tokensAdded, uint256 usdcAdded);

    constructor(address _token, address _usdc) Ownable(msg.sender) {
        token = IERC20(_token);
        usdcToken = IERC20(_usdc);
    }

    function executeBuyback(uint256 usdcAmount) external onlyOwner {
        require(usdcAmount > 0, "Invalid amount");
        // In real scenario, this would swap USDC -> MINER via DEX
        // For now, we emit event for off-chain execution
        totalBuyback += usdcAmount;
        emit BuybackExecuted(0, usdcAmount); // 0 tokens burned (off-chain swap)
    }

    function setBuybackBudget(uint256 _bps) external onlyOwner {
        require(_bps <= 1000, "Too high"); // Max 10%
        buybackBudgetBps = _bps;
    }

    function withdrawFunds(address token, uint256 amount) external onlyOwner {
        require(IERC20(token).transfer(msg.sender, amount), "Transfer failed");
    }
}
