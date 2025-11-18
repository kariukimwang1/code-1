import { ethers } from "ethers"
import { getContractConfig } from "./contract-registry"

/**
 * Contract Client - Manages interactions with deployed smart contracts
 */

export class ContractClient {
  private provider: ethers.Provider
  private signer?: ethers.Signer
  private config: any

  constructor(networkName = "sepolia") {
    this.config = getContractConfig(networkName)

    // Determine RPC URL
    const rpcUrl =
      networkName === "sepolia"
        ? process.env.SEPOLIA_RPC_URL
        : networkName === "polygon"
          ? process.env.POLYGON_RPC_URL
          : networkName === "bsc"
            ? process.env.BSC_RPC_URL
            : "https://sepolia.infura.io/v3/YOUR_KEY"

    this.provider = new ethers.JsonRpcProvider(rpcUrl)
  }

  setSigner(signerKey: string) {
    this.signer = new ethers.Wallet(signerKey, this.provider)
  }

  getTokenContract() {
    const abi = [
      "function balanceOf(address) view returns (uint256)",
      "function allowance(address, address) view returns (uint256)",
      "function approve(address, uint256) returns (bool)",
      "function transfer(address, uint256) returns (bool)",
      "function totalSupply() view returns (uint256)",
    ]

    return new ethers.Contract(this.config.token, abi, this.signer || this.provider)
  }

  getRewardDistributorContract() {
    const abi = [
      "function claimReward(address, uint256, bytes32, uint256, bytes) external",
      "function processBatch(address[], uint256[], bytes32[], bytes) external",
      "function dailyEmitted() view returns (uint256)",
      "function dailyEmissionCap() view returns (uint256)",
    ]

    return new ethers.Contract(this.config.rewardDistributor, abi, this.signer || this.provider)
  }

  getStakingContract() {
    const abi = [
      "function stake(uint256, uint256) external",
      "function unstake(uint256) external",
      "function claimRewards(uint256) external",
      "function calculateRewards(address, uint256) view returns (uint256)",
      "function miningMultiplier(address) view returns (uint256)",
    ]

    return new ethers.Contract(this.config.staking, abi, this.signer || this.provider)
  }

  getTreasuryContract() {
    const abi = [
      "function executeBuyback(uint256) external",
      "function totalBuyback() view returns (uint256)",
      "function totalBurned() view returns (uint256)",
    ]

    return new ethers.Contract(this.config.treasury, abi, this.signer || this.provider)
  }

  async getUserBalance(userAddress: string): Promise<string> {
    const token = this.getTokenContract()
    const balance = await token.balanceOf(userAddress)
    return ethers.formatEther(balance)
  }

  async getContractStats(): Promise<{
    totalSupply: string
    dailyEmitted: string
    dailyEmissionCap: string
  }> {
    const token = this.getTokenContract()
    const rd = this.getRewardDistributorContract()

    const totalSupply = await token.totalSupply()
    const dailyEmitted = await rd.dailyEmitted()
    const dailyEmissionCap = await rd.dailyEmissionCap()

    return {
      totalSupply: ethers.formatEther(totalSupply),
      dailyEmitted: ethers.formatEther(dailyEmitted),
      dailyEmissionCap: ethers.formatEther(dailyEmissionCap),
    }
  }
}
