import { ThirdwebSDK } from "@thirdweb-dev/sdk"
import fs from "fs"
import path from "path"

// Network configurations
const NETWORKS: Record<string, { rpc: string; chain: string; chainId: number }> = {
  sepolia: {
    rpc: process.env.SEPOLIA_RPC_URL || "https://sepolia.infura.io/v3/YOUR_KEY",
    chain: "sepolia",
    chainId: 11155111,
  },
  polygon: {
    rpc: process.env.POLYGON_RPC_URL || "https://polygon-rpc.com",
    chain: "polygon",
    chainId: 137,
  },
  bsc: {
    rpc: process.env.BSC_RPC_URL || "https://bsc-dataseed1.binance.org:8545",
    chain: "bsc",
    chainId: 56,
  },
}

interface DeploymentConfig {
  tokenName: string
  tokenSymbol: string
  initialSupply: string
  stakingApy: string
  treasuryAddress: string
  rewardOracleAddress: string
}

const DEFAULT_CONFIG: DeploymentConfig = {
  tokenName: "Miner Token",
  tokenSymbol: "MINER",
  initialSupply: "1000000000", // 1 billion tokens
  stakingApy: "2500", // 25% APY (basis points)
  treasuryAddress: process.env.TREASURY_ADDRESS || "",
  rewardOracleAddress: process.env.REWARD_ORACLE_ADDRESS || "",
}

class ThirdwebDeployer {
  private sdk: ThirdwebSDK
  private network: string
  private config: DeploymentConfig
  private deploymentLog: any[] = []

  constructor(network = "sepolia", config: Partial<DeploymentConfig> = {}) {
    this.network = network
    this.config = { ...DEFAULT_CONFIG, ...config }

    // Initialize SDK based on network
    const networkConfig = NETWORKS[network]
    this.sdk = ThirdwebSDK.fromPrivateKey(process.env.PRIVATE_KEY || "", networkConfig.chain)
  }

  async deployToken(): Promise<string> {
    console.log(`[v0] Deploying token on ${this.network}...`)

    try {
      const contractAddress = await this.sdk.deployer.deployToken({
        name: this.config.tokenName,
        primary_sale_recipient: this.config.treasuryAddress,
        symbol: this.config.tokenSymbol,
        initial_supply: this.config.initialSupply,
      })

      console.log(`[v0] Token deployed: ${contractAddress}`)
      this.deploymentLog.push({
        contract: "Token",
        address: contractAddress,
        timestamp: new Date(),
        network: this.network,
      })

      return contractAddress
    } catch (error) {
      console.error("[v0] Token deployment failed:", error)
      throw error
    }
  }

  async deployStaking(tokenAddress: string): Promise<string> {
    console.log("[v0] Deploying staking contract...")

    try {
      // Get staking contract bytecode
      const stakingContractPath = path.join(__dirname, "..", "contracts", "StakingV2.sol")

      // Deploy via factory pattern using thirdweb SDK
      const contractAddress = await this.sdk.deployer.deployContractFromAbi({
        contractMetadata: {
          name: "MINER Staking",
          symbol: "STAKE",
        },
        abi: this.getStakingABI(),
        constructorParams: [tokenAddress],
      } as any)

      console.log(`[v0] Staking deployed: ${contractAddress}`)
      this.deploymentLog.push({
        contract: "Staking",
        address: contractAddress,
        tokenAddress,
        timestamp: new Date(),
        network: this.network,
      })

      return contractAddress
    } catch (error) {
      console.error("[v0] Staking deployment failed:", error)
      throw error
    }
  }

  async deployRewardDistributor(tokenAddress: string, oracleAddress: string): Promise<string> {
    console.log("[v0] Deploying reward distributor...")

    try {
      const contractAddress = await this.sdk.deployer.deployContractFromAbi({
        contractMetadata: {
          name: "MINER Reward Distributor",
          symbol: "DIST",
        },
        abi: this.getRewardDistributorABI(),
        constructorParams: [tokenAddress, oracleAddress],
      } as any)

      console.log(`[v0] Reward distributor deployed: ${contractAddress}`)
      this.deploymentLog.push({
        contract: "RewardDistributor",
        address: contractAddress,
        tokenAddress,
        oracleAddress,
        timestamp: new Date(),
        network: this.network,
      })

      return contractAddress
    } catch (error) {
      console.error("[v0] Reward distributor deployment failed:", error)
      throw error
    }
  }

  async deployTreasury(tokenAddress: string): Promise<string> {
    console.log("[v0] Deploying treasury contract...")

    try {
      const contractAddress = await this.sdk.deployer.deployContractFromAbi({
        contractMetadata: {
          name: "MINER Treasury",
          symbol: "TREAS",
        },
        abi: this.getTreasuryABI(),
        constructorParams: [tokenAddress],
      } as any)

      console.log(`[v0] Treasury deployed: ${contractAddress}`)
      this.deploymentLog.push({
        contract: "Treasury",
        address: contractAddress,
        tokenAddress,
        timestamp: new Date(),
        network: this.network,
      })

      return contractAddress
    } catch (error) {
      console.error("[v0] Treasury deployment failed:", error)
      throw error
    }
  }

  async deployAll(): Promise<void> {
    console.log("[v0] Starting full deployment cycle...")

    const startTime = Date.now()

    // 1. Deploy token first
    const tokenAddress = await this.deployToken()

    // 2. Deploy staking (depends on token)
    const stakingAddress = await this.deployStaking(tokenAddress)

    // 3. Deploy reward distributor (depends on token)
    const rewardDistributorAddress = await this.deployRewardDistributor(tokenAddress, this.config.rewardOracleAddress)

    // 4. Deploy treasury (depends on token)
    const treasuryAddress = await this.deployTreasury(tokenAddress)

    const endTime = Date.now()
    const deploymentTime = (endTime - startTime) / 1000

    console.log(`[v0] All contracts deployed in ${deploymentTime}s`)

    await this.saveDeploymentConfig({
      tokenAddress,
      stakingAddress,
      rewardDistributorAddress,
      treasuryAddress,
      network: this.network,
      timestamp: new Date(),
      deploymentTime,
    })
  }

  private async saveDeploymentConfig(config: any): Promise<void> {
    const fileName = `deployment-${this.network}-${Date.now()}.json`
    const filePath = path.join(__dirname, "..", "deployments", fileName)

    // Create deployments directory if not exists
    const deploymentsDir = path.dirname(filePath)
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true })
    }

    fs.writeFileSync(filePath, JSON.stringify(config, null, 2))
    console.log(`[v0] Deployment config saved: ${filePath}`)

    // Also update latest.json
    const latestPath = path.join(deploymentsDir, "latest.json")
    fs.writeFileSync(latestPath, JSON.stringify(config, null, 2))
  }

  private getStakingABI(): any[] {
    return [
      {
        inputs: [{ internalType: "address", name: "_token", type: "address" }],
        stateMutability: "nonpayable",
        type: "constructor",
      },
    ]
  }

  private getRewardDistributorABI(): any[] {
    return [
      {
        inputs: [
          { internalType: "address", name: "_token", type: "address" },
          { internalType: "address", name: "_oracle", type: "address" },
        ],
        stateMutability: "nonpayable",
        type: "constructor",
      },
    ]
  }

  private getTreasuryABI(): any[] {
    return [
      {
        inputs: [{ internalType: "address", name: "_token", type: "address" }],
        stateMutability: "nonpayable",
        type: "constructor",
      },
    ]
  }
}

async function main() {
  const network = process.argv[2] || "sepolia"
  const deployer = new ThirdwebDeployer(network)

  try {
    await deployer.deployAll()
    console.log("[v0] Deployment completed successfully!")
    process.exit(0)
  } catch (error) {
    console.error("[v0] Deployment failed:", error)
    process.exit(1)
  }
}

main()
