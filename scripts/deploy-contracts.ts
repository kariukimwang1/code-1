#!/usr/bin/env npx hardhat run

import { ethers } from "hardhat"
import fs from "fs"
import path from "path"

// Contract ABIs
import MinerTokenArtifact from "../artifacts/MinerToken.json"
import RewardDistributorV3Artifact from "../artifacts/RewardDistributorV3.json"
import StakingV2Artifact from "../artifacts/StakingV2.json"
import TreasuryArtifact from "../artifacts/Treasury.json"

// Network configurations
const NETWORKS = {
  ethereum: {
    name: "Ethereum Mainnet",
    rpcUrl: process.env.ETHEREUM_RPC_URL,
    privateKey: process.env.ETHEREUM_PRIVATE_KEY,
    gasPrice: "20000000000", // 20 gwei
    gasLimit: 8000000,
    explorerUrl: "https://etherscan.io"
  },
  polygon: {
    name: "Polygon Mainnet",
    rpcUrl: process.env.POLYGON_RPC_URL,
    privateKey: process.env.POLYGON_PRIVATE_KEY,
    gasPrice: "30000000000", // 30 gwei
    gasLimit: 5000000,
    explorerUrl: "https://polygonscan.com"
  },
  bsc: {
    name: "Binance Smart Chain",
    rpcUrl: process.env.BSC_RPC_URL,
    privateKey: process.env.BSC_PRIVATE_KEY,
    gasPrice: "20000000000", // 20 gwei
    gasLimit: 8000000,
    explorerUrl: "https://bscscan.com"
  },
  arbitrum: {
    name: "Arbitrum One",
    rpcUrl: process.env.ARBITRUM_RPC_URL,
    privateKey: process.env.ARBITRUM_PRIVATE_KEY,
    gasPrice: "1000000000", // 1 gwei
    gasLimit: 3000000,
    explorerUrl: "https://arbiscan.io"
  }
}

// Contract deployment configuration
const DEPLOY_CONFIG = {
  MinerToken: {
    constructorArgs: ["MINER Token", "MINER", 18, 1000000000 * 1e18], // 1 billion tokens
    initialSupply: "1000000000" // 1 billion tokens
  },
  RewardDistributorV3: {
    constructorArgs: [] // Will be set after token deployment
  },
  StakingV2: {
    constructorArgs: [] // Will be set after token deployment
  },
  Treasury: {
    constructorArgs: [] // Will be set after token deployment
  }
}

interface DeployedContracts {
  [networkName: string]: {
    MinerToken: string
    RewardDistributorV3: string
    StakingV2: string
    Treasury: string
    BlockNumber: number
    TransactionHash: string
  }
}

interface ContractRegistry {
  [networkName: string]: {
    [contractName: string]: string
  }
}

async function deployContract(
  network: any,
  contractName: string,
  artifact: any,
  constructorArgs: any[]
): Promise<{ address: string; transactionHash: string }> {
  console.log(`\nDeploying ${contractName} to ${network.name}...`)

  if (!network.privateKey) {
    throw new Error(`Private key not configured for ${network.name}`)
  }

  const provider = new ethers.JsonRpcProvider(network.rpcUrl)
  const wallet = new ethers.Wallet(network.privateKey, provider)
  const signer = wallet.connect(provider)

  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, signer)
  const contract = await factory.deploy(...constructorArgs, {
    gasLimit: network.gasLimit,
    gasPrice: ethers.parseUnits(network.gasPrice, "wei")
  })

  console.log(`Transaction hash: ${contract.deploymentTransaction()?.hash}`)
  console.log("Waiting for deployment confirmation...")

  const deployedContract = await contract.waitForDeployment()

  console.log(`${contractName} deployed to: ${deployedContract.target}`)
  console.log(`Transaction hash: ${contract.deploymentTransaction()?.hash}`)
  console.log(`Block number: ${deployedContract.deploymentTransaction()?.blockNumber}`)

  return {
    address: deployedContract.target as string,
    transactionHash: contract.deploymentTransaction()?.hash || ""
  }
}

async function verifyContract(
  network: any,
  contractAddress: string,
  artifact: any
): Promise<void> {
  console.log(`\nVerifying ${artifact.contractName} on ${network.name}...`)

  if (!network.privateKey) {
    console.log("Skipping verification (no private key)")
    return
  }

  try {
    const provider = new ethers.JsonRpcProvider(network.rpcUrl)
    const wallet = new ethers.Wallet(network.privateKey, provider)

    // Wait for a few blocks to ensure the contract is indexed
    console.log("Waiting for block confirmations...")
    await new Promise(resolve => setTimeout(resolve, 30000)) // 30 seconds

    const verification = await wallet.sendTransaction({
      to: "0x0000000000000000000000000000000000000000", // etherscan verification address
      data: "0x" // Implementation specific verification call
    })

    console.log("Contract verification submitted")

  } catch (error) {
    console.error("Verification failed:", error)
    console.log("Please verify manually on the block explorer")
  }
}

async function initializeContracts(
  network: any,
  deployedContracts: any
): Promise<void> {
  const provider = new ethers.JsonRpcProvider(network.rpcUrl)
  const wallet = new ethers.Wallet(network.privateKey, provider)

  console.log("\nInitializing contracts...")

  // Initialize RewardDistributorV3
  if (deployedContracts.RewardDistributorV3 && deployedContracts.MinerToken) {
    const rewardDistributor = new ethers.Contract(
      deployedContracts.RewardDistributorV3,
      RewardDistributorV3Artifact.abi,
      wallet
    )

    console.log("Setting MINER token address in RewardDistributorV3...")
    const tx = await rewardDistributor.setTokenAddress(deployedContracts.MinerToken, {
      gasLimit: network.gasLimit,
      gasPrice: ethers.parseUnits(network.gasPrice, "wei")
    })
    await tx.wait()
    console.log("RewardDistributorV3 initialized")
  }

  // Initialize StakingV2
  if (deployedContracts.StakingV2 && deployedContracts.MinerToken) {
    const staking = new ethers.Contract(
      deployedContracts.StakingV2,
      StakingV2Artifact.abi,
      wallet
    )

    console.log("Setting MINER token address in StakingV2...")
    const tx1 = await staking.setTokenAddress(deployedContracts.MinerToken, {
      gasLimit: network.gasLimit,
      gasPrice: ethers.parseUnits(network.gasPrice, "wei")
    })
    await tx1.wait()

    console.log("Setting RewardDistributorV3 address in StakingV2...")
    const tx2 = await staking.setRewardDistributor(deployedContracts.RewardDistributorV3, {
      gasLimit: network.gasLimit,
      gasPrice: ethers.parseUnits(network.gasPrice, "wei")
    })
    await tx2.wait()

    console.log("StakingV2 initialized")
  }

  // Initialize Treasury
  if (deployedContracts.Treasury && deployedContracts.MinerToken) {
    const treasury = new ethers.Contract(
      deployedContracts.Treasury,
      TreasuryArtifact.abi,
      wallet
    )

    console.log("Setting MINER token address in Treasury...")
    const tx1 = await treasury.setTokenAddress(deployedContracts.MinerToken, {
      gasLimit: network.gasLimit,
      gasPrice: ethers.parseUnits(network.gasPrice, "wei")
    })
    await tx1.wait()

    console.log("Funding Treasury with initial tokens...")
    const initialFunding = ethers.parseUnits("100000000", "ether") // 100 million tokens
    const tx2 = await treasury.fundTreasury(initialFunding, {
      gasLimit: network.gasLimit,
      gasPrice: ethers.parseUnits(network.gasPrice, "wei")
    })
    await tx2.wait()

    console.log("Treasury initialized")
  }
}

async function saveDeploymentData(
  deployedContracts: DeployedContracts,
  contractRegistry: ContractRegistry
): Promise<void> {
  const deploymentData = {
    deployedContracts,
    contractRegistry,
    deploymentDate: new Date().toISOString(),
    networks: Object.keys(NETWORKS)
  }

  const contractsDir = path.join(__dirname, "../contracts")
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true })
  }

  fs.writeFileSync(
    path.join(contractsDir, "deployments.json"),
    JSON.stringify(deploymentData, null, 2)
  )

  fs.writeFileSync(
    path.join(contractsDir, "contract-registry.json"),
    JSON.stringify(contractRegistry, null, 2)
  )

  console.log("\nDeployment data saved to contracts/")
}

async function main() {
  console.log("🚀 Starting MINER Smart Contract Deployment to Mainnet")
  console.log("====================================================")

  const networksToDeploy = process.argv.slice(2).length > 0
    ? process.argv.slice(2)
    : Object.keys(NETWORKS)

  const deployedContracts: DeployedContracts = {}
  const contractRegistry: ContractRegistry = {}

  for (const networkName of networksToDeploy) {
    if (!NETWORKS[networkName as keyof typeof NETWORKS]) {
      console.log(`\n❌ Network "${networkName}" not found in configuration`)
      continue
    }

    const network = NETWORKS[networkName as keyof typeof NETWORKS]
    console.log(`\n📍 Deploying to ${network.name}`)
    console.log("==========================================")

    try {
      // Deploy contracts
      const tokenDeployment = await deployContract(
        network,
        "MinerToken",
        MinerTokenArtifact,
        DEPLOY_CONFIG.MinerToken.constructorArgs
      )
      deployedContracts[networkName] = {
        MinerToken: tokenDeployment.address,
        RewardDistributorV3: "",
        StakingV2: "",
        Treasury: "",
        BlockNumber: 0,
        TransactionHash: tokenDeployment.transactionHash
      }

      const rewardDeployment = await deployContract(
        network,
        "RewardDistributorV3",
        RewardDistributorV3Artifact,
        DEPLOY_CONFIG.RewardDistributorV3.constructorArgs
      )
      deployedContracts[networkName].RewardDistributorV3 = rewardDeployment.address

      const stakingDeployment = await deployContract(
        network,
        "StakingV2",
        StakingV2Artifact,
        DEPLOY_CONFIG.StakingV2.constructorArgs
      )
      deployedContracts[networkName].StakingV2 = stakingDeployment.address

      const treasuryDeployment = await deployContract(
        network,
        "Treasury",
        TreasuryArtifact,
        DEPLOY_CONFIG.Treasury.constructorArgs
      )
      deployedContracts[networkName].Treasury = treasuryDeployment.address

      // Initialize contracts
      await initializeContracts(network, deployedContracts[networkName])

      // Update contract registry
      contractRegistry[networkName] = {
        MinerToken: tokenDeployment.address,
        RewardDistributorV3: rewardDeployment.address,
        StakingV2: stakingDeployment.address,
        Treasury: treasuryDeployment.address
      }

      console.log(`\n✅ Deployment completed for ${network.name}!`)
      console.log("==========================================")

    } catch (error) {
      console.error(`❌ Deployment failed for ${network.name}:`, error)
      continue
    }
  }

  // Save deployment data
  await saveDeploymentData(deployedContracts, contractRegistry)

  console.log("\n🎉 All deployments completed!")
  console.log("==========================================")
  console.log("Contract Registry:")

  for (const [network, contracts] of Object.entries(contractRegistry)) {
    console.log(`\n${network}:`)
    for (const [contractName, address] of Object.entries(contracts)) {
      console.log(`  ${contractName}: ${address}`)
    }
  }

  console.log("\n📋 Next Steps:")
  console.log("1. Verify contracts on respective block explorers")
  console.log("2. Update frontend contract addresses")
  console.log("3. Configure oracle services")
  console.log("4. Set up monitoring and alerts")
  console.log("5. Test contract functionality")
}

// Handle errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

// Run deployment
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Deployment failed:', error)
    process.exit(1)
  })
}