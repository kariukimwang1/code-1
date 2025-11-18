import { ethers } from "ethers"
import { query } from "./database"

// Contract ABIs
import MinerTokenArtifact from "../artifacts/MinerToken.json"
import RewardDistributorV3Artifact from "../artifacts/RewardDistributorV3.json"
import StakingV2Artifact from "../artifacts/StakingV2.json"
import TreasuryArtifact from "../artifacts/Treasury.json"

// Network configurations
const NETWORK_CONFIGS = {
  1: { // Ethereum Mainnet
    rpcUrl: process.env.ETHEREUM_RPC_URL,
    privateKey: process.env.ETHEREUM_PRIVATE_KEY,
    chainId: 1
  },
 137: { // Polygon Mainnet
    rpcUrl: process.env.POLYGON_RPC_URL,
    privateKey: process.env.POLYGON_PRIVATE_KEY,
    chainId: 137
  },
  56: { // BSC Mainnet
    rpcUrl: process.env.BSC_RPC_URL,
    privateKey: process.env.BSC_PRIVATE_KEY,
    chainId: 56
  },
  42161: { // Arbitrum One
    rpcUrl: process.env.ARBITRUM_RPC_URL,
    privateKey: process.env.ARBITRUM_PRIVATE_KEY,
    chainId: 42161
  }
}

export class ContractAutomation {
  private provider: ethers.Provider
  private wallet: ethers.Wallet
  private contracts: any = {}

  constructor(networkId: number) {
    const config = NETWORK_CONFIGS[networkId as keyof typeof NETWORK_CONFIGS]
    if (!config) {
      throw new Error(`Network ${networkId} not configured`)
    }

    this.provider = new ethers.JsonRpcProvider(config.rpcUrl)
    this.wallet = new ethers.Wallet(config.privateKey, this.provider)

    // Initialize contracts
    this.contracts.MinerToken = new ethers.Contract(
      process.env.MINER_TOKEN_ADDRESS!,
      MinerTokenArtifact.abi,
      this.wallet
    )

    this.contracts.RewardDistributorV3 = new ethers.Contract(
      process.env.REWARD_DISTRIBUTOR_ADDRESS!,
      RewardDistributorV3Artifact.abi,
      this.wallet
    )

    this.contracts.StakingV2 = new ethers.Contract(
      process.env.STAKING_V2_ADDRESS!,
      StakingV2Artifact.abi,
      this.wallet
    )

    this.contracts.Treasury = new ethers.Contract(
      process.env.TREASURY_ADDRESS!,
      TreasuryArtifact.abi,
      this.wallet
    )
  }

  async executeBuyback(amount: number): Promise<{ success: boolean; txHash: string; error?: string }> {
    try {
      console.log(`Executing token buyback for ${amount} MINER tokens`)

      const amountWei = ethers.parseUnits(amount.toString(), "ether")

      // Execute buyback through Treasury contract
      const tx = await this.contracts.Treasury.executeBuyback(amountWei, {
        gasLimit: 300000,
        gasPrice: await this.getOptimalGasPrice()
      })

      const receipt = await tx.wait()

      // Record transaction in database
      await query(
        `INSERT INTO treasury_transactions (type, amount, token_address, transaction_hash, executed_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        ['buyback', amount.toString(), process.env.MINER_TOKEN_ADDRESS!, tx.hash]
      )

      console.log(`Buyback executed successfully: ${tx.hash}`)
      return {
        success: true,
        txHash: tx.hash
      }

    } catch (error: any) {
      console.error('Buyback execution failed:', error)
      return {
        success: false,
        txHash: '',
        error: error.message || 'Unknown error'
      }
    }
  }

  async burnTokens(amount: number): Promise<{ success: boolean; txHash: string; error?: string }> {
    try {
      console.log(`Burning ${amount} MINER tokens`)

      const amountWei = ethers.parseUnits(amount.toString(), "ether")

      // Burn tokens through Treasury contract
      const tx = await this.contracts.Treasury.burnTokens(amountWei, {
        gasLimit: 200000,
        gasPrice: await this.getOptimalGasPrice()
      })

      const receipt = await tx.wait()

      // Record transaction in database
      await query(
        `INSERT INTO treasury_transactions (type, amount, token_address, transaction_hash, executed_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        ['burn', amount.toString(), process.env.MINER_TOKEN_ADDRESS!, tx.hash]
      )

      console.log(`Tokens burned successfully: ${tx.hash}`)
      return {
        success: true,
        txHash: tx.hash
      }

    } catch (error: any) {
      console.error('Token burning failed:', error)
      return {
        success: false,
        txHash: '',
        error: error.message || 'Unknown error'
      }
    }
  }

  async distributeRewards(): Promise<{ success: boolean; txHash: string; totalDistributed: number; error?: string }> {
    try {
      console.log("Executing reward distribution...")

      // Get pending rewards from database
      const pendingRewardsResult = await query(
        `SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total_amount
         FROM reward_queue
         WHERE status = 'pending'`
      )

      const pendingRewards = pendingRewardsResult.rows[0]

      if (pendingRewards.count === 0) {
        console.log("No pending rewards to distribute")
        return {
          success: true,
          txHash: '',
          totalDistributed: 0
        }
      }

      // Execute distribution through RewardDistributor
      const tx = await this.contracts.RewardDistributorV3.distributePendingRewards({
        gasLimit: 1000000,
        gasPrice: await this.getOptimalGasPrice()
      })

      const receipt = await tx.wait()

      // Update database records
      await query(
        `UPDATE reward_queue
         SET status = 'distributed', distributed_at = NOW()
         WHERE status = 'pending'`
      )

      // Record transaction
      await query(
        `INSERT INTO treasury_transactions (type, amount, token_address, transaction_hash, executed_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        ['reward_distribution', pendingRewards.total_amount.toString(), process.env.MINER_TOKEN_ADDRESS!, tx.hash]
      )

      console.log(`Rewards distributed successfully: ${tx.hash}`)
      console.log(`Total distributed: ${pendingRewards.total_amount} MINER tokens`)

      return {
        success: true,
        txHash: tx.hash,
        totalDistributed: parseFloat(pendingRewards.total_amount)
      }

    } catch (error: any) {
      console.error('Reward distribution failed:', error)
      return {
        success: false,
        txHash: '',
        totalDistributed: 0,
        error: error.message || 'Unknown error'
      }
    }
  }

  async updateOraclePrices(
    tokenPrice: number,
    rewardRate: number
  ): Promise<{ success: boolean; txHash: string; error?: string }> {
    try {
      console.log(`Updating oracle prices - Token: $${tokenPrice}, Reward Rate: ${rewardRate}`)

      // Update prices in RewardDistributor
      const tx = await this.contracts.RewardDistributorV3.updateOraclePrices(
        ethers.parseUnits(tokenPrice.toString(), "ether"),
        rewardRate,
        {
          gasLimit: 200000,
          gasPrice: await this.getOptimalGasPrice()
        }
      )

      const receipt = await tx.wait()

      // Update database
      await query(
        `INSERT INTO oracle_updates (token_price_usd, reward_rate, block_number, transaction_hash, updated_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [tokenPrice, rewardRate, receipt.blockNumber || 0, tx.hash]
      )

      console.log(`Oracle prices updated: ${tx.hash}`)
      return {
        success: true,
        txHash: tx.hash
      }

    } catch (error: any) {
      console.error('Oracle update failed:', error)
      return {
        success: false,
        txHash: '',
        error: error.message || 'Unknown error'
      }
    }
  }

  async getOptimalGasPrice(): Promise<bigint> {
    try {
      const gasPrice = await this.provider.getFeeData()
      return gasPrice.gasPrice
    } catch (error) {
      console.error('Failed to get gas price:', error)
      // Fallback to fixed gas price
      return ethers.parseUnits("20", "gwei")
    }
  }

  async getContractBalances(): Promise<{
    MinerToken: string
    Treasury: string
    RewardDistributor: string
    StakingV2: string
  }> {
    try {
      const tokenBalance = await this.contracts.MinerToken.balanceOf(
        await this.wallet.getAddress()
      )

      const treasuryBalance = await this.contracts.Treasury.balanceOf(
        await this.wallet.getAddress()
      )

      const rewardDistributorBalance = await this.contracts.RewardDistributorV3.balanceOf(
        this.contracts.MinerToken.target
      )

      const stakingBalance = await this.contracts.StakingV2.balanceOf(
        this.contracts.MinerToken.target
      )

      return {
        MinerToken: ethers.formatEther(tokenBalance),
        Treasury: ethers.formatEther(treasuryBalance),
        RewardDistributorV3: ethers.formatEther(rewardDistributorBalance),
        StakingV2: ethers.formatEther(stakingBalance)
      }

    } catch (error) {
      console.error('Failed to get contract balances:', error)
      throw error
    }
  }

  async getTreasuryMetrics(): Promise<{
    totalSupply: string
    circulatingSupply: string
    treasuryBalance: string
    backingRatio: number
  }> {
    try {
      const totalSupply = await this.contracts.MinerToken.totalSupply()
      const treasuryBalance = await this.contracts.Treasury.balanceOf(
        this.contracts.MinerToken.target
      )

      // Calculate circulating supply (total supply - treasury balance - other contracts)
      const contractsBalance = await this.contracts.RewardDistributorV3.balanceOf(
        this.contracts.MinerToken.target
      ) + await this.contracts.StakingV2.balanceOf(
        this.contracts.MinerToken.target
      )

      const circulatingSupply = totalSupply - treasuryBalance - contractsBalance
      const backingRatio = totalSupply > 0 ?
        (parseFloat(ethers.formatEther(treasuryBalance)) / parseFloat(ethers.formatEther(totalSupply))) * 100 : 0

      return {
        totalSupply: ethers.formatEther(totalSupply),
        circulatingSupply: ethers.formatEther(circulatingSupply),
        treasuryBalance: ethers.formatEther(treasuryBalance),
        backingRatio: backingRatio
      }

    } catch (error) {
      console.error('Failed to get treasury metrics:', error)
      throw error
    }
  }

  async monitorSystemHealth(): Promise<{
    isConnected: boolean
    blockNumber: number
    gasPrice: string
    walletBalance: string
  }> {
    try {
      const blockNumber = await this.provider.getBlockNumber()
      const gasPrice = await this.getOptimalGasPrice()
      const walletBalance = ethers.formatEther(await this.provider.getBalance(this.wallet.address))

      return {
        isConnected: true,
        blockNumber,
        gasPrice: ethers.formatUnits(gasPrice, "gwei"),
        walletBalance
      }

    } catch (error) {
      console.error('System health check failed:', error)
      return {
        isConnected: false,
        blockNumber: 0,
        gasPrice: "0",
        walletBalance: "0"
      }
    }
  }

  async emergencyPause(): Promise<{ success: boolean; txHash: string; error?: string }> {
    try {
      console.log("Executing emergency pause...")

      // Emergency pause through Treasury contract
      const tx = await this.contracts.Treasury.emergencyPause({
        gasLimit: 100000,
        gasPrice: await this.getOptimalGasPrice()
      })

      const receipt = await tx.wait()

      console.log(`Emergency pause executed: ${tx.hash}`)
      return {
        success: true,
        txHash: tx.hash
      }

    } catch (error: any) {
      console.error('Emergency pause failed:', error)
      return {
        success: false,
        txHash: '',
        error: error.message || 'Unknown error'
      }
    }
  }

  async emergencyResume(): Promise<{ success: boolean; txHash: string; error?: string }> {
    try {
      console.log("Executing emergency resume...")

      // Emergency resume through Treasury contract
      const tx = await this.contracts.Treasury.emergencyResume({
        gasLimit: 100000,
        gasPrice: await this.getOptimalGasPrice()
      })

      const receipt = await tx.wait()

      console.log(`Emergency resume executed: ${tx.hash}`)
      return {
        success: true,
        txHash: tx.hash
      }

    } catch (error: any) {
      console.error('Emergency resume failed:', error)
      return {
        success: false,
        txHash: '',
        error: error.message || 'Unknown error'
      }
    }
  }
}

// Singleton instance for contract automation
let contractAutomation: ContractAutomation | null = null

export function getContractAutomation(networkId: number = 1): ContractAutomation {
  if (!contractAutomation) {
    contractAutomation = new ContractAutomation(networkId)
  }
  return contractAutomation
}

export async function executeAutomatedOperations(): Promise<void> {
  try {
    console.log("🤖 Starting automated contract operations...")

    const automation = getContractAutomation(1) // Default to Ethereum

    // System health check
    const health = await automation.monitorSystemHealth()
    console.log(`System health: ${health.isConnected ? 'Connected' : 'Disconnected'}, Block: ${health.blockNumber}`)

    if (!health.isConnected) {
      console.log("❌ System not connected, skipping automated operations")
      return
    }

    // Update oracle prices (every 5 minutes)
    console.log("📊 Updating oracle prices...")
    const oracleResult = await automation.updateOraclePrices(1.25, 100) // Example prices
    if (!oracleResult.success) {
      console.error("❌ Oracle price update failed:", oracleResult.error)
    }

    // Check for pending reward distributions
    console.log("🎁 Checking for pending rewards...")
    const rewardResult = await automation.distributeRewards()
    if (!rewardResult.success) {
      console.error("❌ Reward distribution failed:", rewardResult.error)
    } else if (rewardResult.totalDistributed > 0) {
      console.log(`✅ Distributed ${rewardResult.totalDistributed} MINER tokens`)
    }

    // Check treasury health and backing ratio
    console.log("💰 Checking treasury metrics...")
    const metrics = await automation.getTreasuryMetrics()
    console.log(`Backing ratio: ${metrics.backingRatio.toFixed(2)}%`)

    // Auto-buyback if backing ratio is too low (below 95%)
    if (metrics.backingRatio < 95) {
      const buybackAmount = Math.floor(parseFloat(metrics.totalSupply) * 0.001) // 0.1% of total supply
      console.log(`⚡ Low backing ratio detected, executing buyback of ${buybackAmount} MINER tokens`)

      const buybackResult = await automation.executeBuyback(buybackAmount)
      if (!buybackResult.success) {
        console.error("❌ Auto-buyback failed:", buybackResult.error)
      } else {
        console.log(`✅ Auto-buyback executed: ${buybackResult.txHash}`)
      }
    }

    console.log("✅ Automated operations completed successfully")

  } catch (error) {
    console.error("❌ Automated operations failed:", error)
  }
}

// Schedule automated operations to run every 5 minutes
setInterval(executeAutomatedOperations, 5 * 60 * 1000)