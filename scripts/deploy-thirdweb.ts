import { ethers } from "ethers"

/**
 * Deploy all MINER contracts to thirdweb
 * Supports: Polygon, BSC, Ethereum, and other EVM networks
 */

const NETWORK_CONFIG: Record<string, any> = {
  polygon: {
    chainId: 137,
    rpc: "https://polygon-rpc.com",
    explorer: "https://polygonscan.com",
  },
  bsc: {
    chainId: 56,
    rpc: "https://bsc-dataseed1.binance.org:8545",
    explorer: "https://bscscan.com",
  },
  ethereum: {
    chainId: 1,
    rpc: "https://eth.rpc.blxrbdn.com",
    explorer: "https://etherscan.io",
  },
  sepolia: {
    chainId: 11155111,
    rpc: "https://sepolia.infura.io/v3/YOUR_INFURA_KEY",
    explorer: "https://sepolia.etherscan.io",
  },
}

interface DeploymentResult {
  tokenAddress: string
  rewardDistributorAddress: string
  stakingAddress: string
  treasuryAddress: string
  deploymentTx: string
  network: string
  timestamp: number
}

async function deployContracts(network: string): Promise<DeploymentResult> {
  const config = NETWORK_CONFIG[network]
  if (!config) throw new Error(`Unknown network: ${network}`)

  console.log(`\n🚀 Deploying MINER contracts to ${network}...`)

  const provider = new ethers.JsonRpcProvider(config.rpc)
  const deployerKey = process.env.DEPLOYER_PRIVATE_KEY
  if (!deployerKey) throw new Error("DEPLOYER_PRIVATE_KEY not set")

  const deployer = new ethers.Wallet(deployerKey, provider)
  console.log(`📍 Deployer: ${deployer.address}`)

  // 1. Deploy MinerToken
  console.log("\n1️⃣ Deploying MinerToken...")
  const tokenFactory = new ethers.ContractFactory(
    require("../contracts/MinerToken.json").abi,
    require("../contracts/MinerToken.json").bytecode,
    deployer,
  )
  const token = await tokenFactory.deploy(deployer.address)
  await token.waitForDeployment()
  const tokenAddress = await token.getAddress()
  console.log(`✅ MinerToken deployed to: ${tokenAddress}`)

  // 2. Deploy RewardDistributor
  console.log("\n2️⃣ Deploying RewardDistributor...")
  const rdFactory = new ethers.ContractFactory(
    require("../contracts/RewardDistributorV2.json").abi,
    require("../contracts/RewardDistributorV2.json").bytecode,
    deployer,
  )
  const rewardDist = await rdFactory.deploy(tokenAddress, deployer.address, deployer.address)
  await rewardDist.waitForDeployment()
  const rdAddress = await rewardDist.getAddress()
  console.log(`✅ RewardDistributor deployed to: ${rdAddress}`)

  // 3. Deploy Staking
  console.log("\n3️⃣ Deploying Staking contract...")
  const stakingFactory = new ethers.ContractFactory(
    require("../contracts/StakingV2.json").abi,
    require("../contracts/StakingV2.json").bytecode,
    deployer,
  )
  const staking = await stakingFactory.deploy(tokenAddress, rdAddress)
  await staking.waitForDeployment()
  const stakingAddress = await staking.getAddress()
  console.log(`✅ Staking deployed to: ${stakingAddress}`)

  // 4. Deploy Treasury
  console.log("\n4️⃣ Deploying Treasury...")
  const treasuryFactory = new ethers.ContractFactory(
    require("../contracts/Treasury.json").abi,
    require("../contracts/Treasury.json").bytecode,
    deployer,
  )
  const usdc = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" // USDC address (adjust per network)
  const treasury = await treasuryFactory.deploy(tokenAddress, usdc)
  await treasury.waitForDeployment()
  const treasuryAddress = await treasury.getAddress()
  console.log(`✅ Treasury deployed to: ${treasuryAddress}`)

  // 5. Set contract relationships
  console.log("\n🔗 Setting contract relationships...")
  const tokenContract = await ethers.getContractAt("MinerToken", tokenAddress, deployer)
  await tokenContract.setRewardDistributor(rdAddress)
  await tokenContract.setStakingContract(stakingAddress)
  console.log("✅ Token contract updated")

  const result: DeploymentResult = {
    tokenAddress,
    rewardDistributorAddress: rdAddress,
    stakingAddress,
    treasuryAddress,
    deploymentTx: "0x0", // Placeholder
    network,
    timestamp: Date.now(),
  }

  console.log("\n📋 Deployment Summary:")
  console.log(JSON.stringify(result, null, 2))

  return result
}
// Main
;(async () => {
  try {
    const network = process.argv[2] || "sepolia"
    await deployContracts(network)
  } catch (error) {
    console.error("❌ Deployment failed:", error)
    process.exit(1)
  }
})()
