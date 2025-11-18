#!/usr/bin/env npx tsx

/**
 * PRODUCTION CONTRACT AUTOMATION
 *
 * This script manages automated operations for the MINER platform in production
 * including treasury management, buybacks, rewards distribution, and monitoring.
 */

import { ethers } from 'ethers'
import cron from 'node-cron'
import Redis from 'ioredis'
import { exec } from 'child_process'
import fs from 'fs/promises'
import path from 'path'

// Configuration
const PRODUCTION_CONFIG = {
  networks: {
    ethereum: {
      rpc: process.env.ETHEREUM_RPC_URL!,
      token: process.env.ETHEREUM_TOKEN_ADDRESS!,
      mining: process.env.ETHEREUM_MINING_ADDRESS!,
      staking: process.env.ETHEREUM_STAKING_ADDRESS!,
      treasury: process.env.ETHEREUM_TREASURY_ADDRESS!,
      chainId: 1
    },
    polygon: {
      rpc: process.env.POLYGON_RPC_URL!,
      token: process.env.POLYGON_TOKEN_ADDRESS!,
      mining: process.env.POLYGON_MINING_ADDRESS!,
      staking: process.env.POLYGON_STAKING_ADDRESS!,
      treasury: process.env.POLYGON_TREASURY_ADDRESS!,
      chainId: 137
    },
    bsc: {
      rpc: process.env.BSC_RPC_URL!,
      token: process.env.BSC_TOKEN_ADDRESS!,
      mining: process.env.BSC_MINING_ADDRESS!,
      staking: process.env.BSC_STAKING_ADDRESS!,
      treasury: process.env.BSC_TREASURY_ADDRESS!,
      chainId: 56
    }
  },
  automation: {
    buybackEnabled: process.env.BUYBACK_ENABLED === 'true',
    buybackThreshold: parseFloat(process.env.BUYBACK_THRESHOLD_ETH || '5.0'),
    buybackPercentage: parseFloat(process.env.BUYBACK_PERCENTAGE || '0.02'),
    distributionEnabled: process.env.TREASURY_DISTRIBUTION_ENABLED === 'true',
    monitoringInterval: 30000, // 30 seconds
    healthCheckInterval: 60000 // 1 minute
  }
}

// State management
let redis: Redis
let automationState: any = {}
let providers: Map<string, ethers.JsonRpcProvider> = new Map()
let contracts: Map<string, any> = new Map()

// Initialize systems
async function initializeAutomation() {
  console.log('🤖 Initializing Production Automation System...')

  // Initialize Redis
  redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')
  console.log('✅ Redis connected')

  // Initialize providers
  for (const [networkName, config] of Object.entries(PRODUCTION_CONFIG.networks)) {
    const provider = new ethers.JsonRpcProvider(config.rpc)
    providers.set(networkName, provider)
    console.log(`✅ ${networkName} provider initialized`)
  }

  // Load automation state
  const savedState = await redis.get('miner:automation:state')
  if (savedState) {
    automationState = JSON.parse(savedState)
  }

  // Initialize contracts
  await initializeContracts()

  // Start monitoring
  startMonitoring()

  // Start scheduled tasks
  startScheduledTasks()

  console.log('🎉 Production Automation System Initialized')
}

// Contract initialization
async function initializeContracts() {
  const tokenAbi = [
    'function balanceOf(address) view returns (uint256)',
    'function transfer(address, uint256) returns (bool)',
    'function totalSupply() view returns (uint256)',
    'function name() view returns (string)',
    'function symbol() view returns (string)'
  ]

  const miningAbi = [
    'function totalHashPower() view returns (uint256)',
    'function rewardPool() view returns (uint256)',
    'function setRewardRate(uint256)',
    'function emergencyPause()',
    'function emergencyResume()'
  ]

  const stakingAbi = [
    'function totalStaked() view returns (uint256)',
    'function rewardPool() view returns (uint256)',
    'function setBaseAPY(uint256)',
    'function distributeRewards()'
  ]

  for (const [networkName, config] of Object.entries(PRODUCTION_CONFIG.networks)) {
    const provider = providers.get(networkName)!

    // Token contract
    if (config.token) {
      contracts.set(`${networkName}:token`, new ethers.Contract(config.token, tokenAbi, provider))
    }

    // Mining contract
    if (config.mining) {
      contracts.set(`${networkName}:mining`, new ethers.Contract(config.mining, miningAbi, provider))
    }

    // Staking contract
    if (config.staking) {
      contracts.set(`${networkName}:staking`, new ethers.Contract(config.staking, stakingAbi, provider))
    }

    console.log(`✅ ${networkName} contracts initialized`)
  }
}

// Health monitoring
async function startMonitoring() {
  console.log('📊 Starting continuous monitoring...')

  setInterval(async () => {
    try {
      await performHealthChecks()
    } catch (error) {
      console.error('❌ Health check failed:', error)
      await logError('health_check_failed', error)
    }
  }, PRODUCTION_CONFIG.automation.monitoringInterval)

  // Emergency pause monitoring
  setInterval(async () => {
    try {
      await checkEmergencyConditions()
    } catch (error) {
      console.error('❌ Emergency check failed:', error)
      await logError('emergency_check_failed', error)
    }
  }, PRODUCTION_CONFIG.automation.healthCheckInterval)
}

// Health checks
async function performHealthChecks() {
  const healthData: any = {
    timestamp: new Date().toISOString(),
    networks: {},
    overall: 'healthy'
  }

  for (const [networkName, config] of Object.entries(PRODUCTION_CONFIG.networks)) {
    try {
      const provider = providers.get(networkName)!
      const blockNumber = await provider.getBlockNumber()
      const gasPrice = await provider.getFeeData()

      const networkHealth = {
        blockNumber,
        gasPrice: gasPrice.gasPrice?.toString(),
        connected: true,
        latency: Date.now()
      }

      // Check contract balances
      const tokenContract = contracts.get(`${networkName}:token`)
      if (tokenContract && config.treasury) {
        const balance = await tokenContract.balanceOf(config.treasury)
        networkHealth.treasuryBalance = ethers.formatEther(balance)
      }

      healthData.networks[networkName] = networkHealth
      console.log(`📈 ${networkName}: Block ${blockNumber}, Gas: ${ethers.formatUnits(gasPrice.gasPrice || 0, 9)} Gwei`)

    } catch (error) {
      healthData.networks[networkName] = {
        connected: false,
        error: error.message
      }
      healthData.overall = 'unhealthy'
      console.error(`❌ ${networkName} health check failed:`, error.message)
    }
  }

  // Save health data
  await redis.setex('miner:health:latest', 300, JSON.stringify(healthData))

  // Alert if unhealthy
  if (healthData.overall === 'unhealthy') {
    await sendAlert('system_unhealthy', 'System health checks failing', healthData)
  }
}

// Emergency condition checks
async function checkEmergencyConditions() {
  const emergencyPause = process.env.EMERGENCY_PAUSE === 'true'
  if (emergencyPause && !automationState.emergencyPaused) {
    console.log('🚨 EMERGENCY PAUSE ACTIVATED')
    await activateEmergencyPause('Manual emergency pause activated')
    return
  }

  // Check for unusual conditions
  for (const [networkName, config] of Object.entries(PRODUCTION_CONFIG.networks)) {
    try {
      const provider = providers.get(networkName)!
      const feeData = await provider.getFeeData()

      // Check for gas price spikes
      if (feeData.gasPrice) {
        const gasPriceGwei = parseFloat(ethers.formatUnits(feeData.gasPrice, 9))
        if (gasPriceGwei > 100) {
          console.warn(`⚠️ High gas prices on ${networkName}: ${gasPriceGwei} Gwei`)

          if (gasPriceGwei > 500) {
            await sendAlert('high_gas_prices', `Extremely high gas on ${networkName}: ${gasPriceGwei} Gwei`, {
              network: networkName,
              gasPrice: gasPriceGwei
            })
          }
        }
      }

    } catch (error) {
      console.error(`❌ Emergency check for ${networkName} failed:`, error)
    }
  }
}

// Scheduled tasks
function startScheduledTasks() {
  console.log('⏰ Starting scheduled tasks...')

  // Daily reward distribution (midnight UTC)
  cron.schedule('0 0 * * *', async () => {
    console.log('🎁 Starting daily reward distribution...')
    await distributeRewards()
  })

  // Hourly buyback check
  cron.schedule('0 * * * *', async () => {
    console.log('💰 Checking buyback conditions...')
    await checkBuybackConditions()
  })

  // Weekly system cleanup
  cron.schedule('0 2 * * 0', async () => {
    console.log('🧹 Starting weekly system cleanup...')
    await performSystemCleanup()
  })

  // Monthly treasury report
  cron.schedule('0 3 1 * *', async () => {
    console.log('📊 Generating monthly treasury report...')
    await generateTreasuryReport()
  })
}

// Reward distribution
async function distributeRewards() {
  if (!PRODUCTION_CONFIG.automation.distributionEnabled) {
    console.log('🔸 Reward distribution disabled')
    return
  }

  try {
    for (const [networkName, config] of Object.entries(PRODUCTION_CONFIG.networks)) {
      const stakingContract = contracts.get(`${networkName}:staking`)
      if (!stakingContract) continue

      console.log(`🎁 Distributing rewards on ${networkName}...`)

      // Get signer (treasury multisig in production)
      const provider = providers.get(networkName)!
      const signer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider)

      const stakingWithSigner = stakingContract.connect(signer)
      const tx = await stakingWithSigner.distributeRewards({
        gasPrice: await provider.getFeeData().then(f => f.gasPrice),
        gasLimit: 500000
      })

      console.log(`📤 Rewards distribution transaction: ${tx.hash}`)
      await tx.wait(2)

      console.log(`✅ Rewards distributed on ${networkName}`)
    }

    // Update distribution tracking
    automationState.lastDistribution = new Date().toISOString()
    await saveAutomationState()

  } catch (error) {
    console.error('❌ Reward distribution failed:', error)
    await logError('reward_distribution_failed', error)
    await sendAlert('reward_distribution_failed', 'Reward distribution system failure', error)
  }
}

// Buyback automation
async function checkBuybackConditions() {
  if (!PRODUCTION_CONFIG.automation.buybackEnabled) {
    console.log('🔸 Buyback automation disabled')
    return
  }

  try {
    // Get ETH price from oracle (simplified)
    const ethPrice = 2000 // Would get from Chainlink price feed
    const thresholdValue = PRODUCTION_CONFIG.automation.buybackThreshold * ethPrice

    for (const [networkName, config] of Object.entries(PRODUCTION_CONFIG.networks)) {
      if (networkName !== 'ethereum') continue // Only buyback on mainnet for now

      const provider = providers.get(networkName)!
      const signer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider)

      // Check treasury ETH balance
      const ethBalance = await provider.getBalance(config.treasury!)
      const ethBalanceValue = parseFloat(ethers.formatEther(ethBalance)) * ethPrice

      console.log(`💰 Treasury: ${ethers.formatEther(ethBalance)} ETH ($${ethBalanceValue.toLocaleString()})`)

      if (ethBalanceValue > thresholdValue) {
        const buybackAmount = ethBalance * BigInt(Math.floor(PRODUCTION_CONFIG.automation.buybackPercentage * 10000)) / BigInt(10000)

        console.log(`🛒 Executing buyback: ${ethers.formatEther(buybackAmount)} ETH`)

        // Execute buyback transaction
        const tx = await signer.sendTransaction({
          to: config.treasury,
          value: buybackAmount,
          data: '0xa9059cbb0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a' // Simplified buyback call
        })

        console.log(`📤 Buyback transaction: ${tx.hash}`)
        await tx.wait(2)

        automationState.lastBuyback = {
          timestamp: new Date().toISOString(),
          amount: ethers.formatEther(buybackAmount),
          network: networkName
        }
        await saveAutomationState()

        console.log(`✅ Buyback completed on ${networkName}`)
      }
    }

  } catch (error) {
    console.error('❌ Buyback check failed:', error)
    await logError('buyback_check_failed', error)
  }
}

// System cleanup
async function performSystemCleanup() {
  try {
    console.log('🧹 Performing system cleanup...')

    // Clean old health data
    const keys = await redis.keys('miner:health:*')
    let deletedCount = 0

    for (const key of keys) {
      const ttl = await redis.ttl(key)
      if (ttl === -1) { // No expiry
        await redis.expire(key, 86400) // Set 24 hour expiry
        deletedCount++
      }
    }

    // Clean old error logs
    const errorKeys = await redis.keys('miner:errors:*')
    for (const key of errorKeys) {
      const data = await redis.get(key)
      if (data) {
        const error = JSON.parse(data)
        const age = Date.now() - new Date(error.timestamp).getTime()
        if (age > 7 * 24 * 60 * 60 * 1000) { // 7 days old
          await redis.del(key)
          deletedCount++
        }
      }
    }

    console.log(`🧹 Cleanup completed: ${deletedCount} items processed`)

  } catch (error) {
    console.error('❌ System cleanup failed:', error)
    await logError('system_cleanup_failed', error)
  }
}

// Treasury report generation
async function generateTreasuryReport() {
  try {
    console.log('📊 Generating monthly treasury report...')

    const report: any = {
      timestamp: new Date().toISOString(),
      networks: {},
      summary: {
        totalValueUSD: 0,
        totalTokens: 0,
        monthlyOperations: 0
      }
    }

    for (const [networkName, config] of Object.entries(PRODUCTION_CONFIG.networks)) {
      try {
        const provider = providers.get(networkName)!
        const tokenContract = contracts.get(`${networkName}:token`)

        // Get ETH/BNB/MATIC balance
        const nativeBalance = await provider.getBalance(config.treasury!)
        const nativeFormatted = ethers.formatEther(nativeBalance)

        // Get token balance
        let tokenBalance = '0'
        if (tokenContract) {
          tokenBalance = ethers.formatEther(await tokenContract.balanceOf(config.treasury!))
        }

        // Calculate USD values (simplified)
        const prices = {
          ethereum: 2000,
          polygon: 0.9,
          bsc: 300
        }

        const nativePriceUSD = prices[networkName as keyof typeof prices] || 0
        const nativeValueUSD = parseFloat(nativeFormatted) * nativePriceUSD

        report.networks[networkName] = {
          nativeBalance: nativeFormatted,
          nativeValueUSD,
          tokenBalance,
          tokenValueUSD: parseFloat(tokenBalance) * 0.01, // Assuming $0.01 per token
          totalValueUSD: nativeValueUSD + parseFloat(tokenBalance) * 0.01
        }

        report.summary.totalValueUSD += report.networks[networkName].totalValueUSD
        report.summary.totalTokens += parseFloat(tokenBalance)

      } catch (error) {
        report.networks[networkName] = { error: error.message }
      }
    }

    // Save report
    await redis.setex('miner:reports:treasury:monthly', 2592000, JSON.stringify(report)) // 30 days

    // Save to file
    const reportPath = path.join(process.cwd(), 'reports', `treasury-${new Date().toISOString().split('T')[0]}.json`)
    await fs.mkdir(path.dirname(reportPath), { recursive: true })
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2))

    console.log(`📊 Treasury report generated: $${report.summary.totalValueUSD.toLocaleString()} total value`)

  } catch (error) {
    console.error('❌ Treasury report generation failed:', error)
    await logError('treasury_report_failed', error)
  }
}

// Emergency pause
async function activateEmergencyPause(reason: string) {
  try {
    automationState.emergencyPaused = true
    automationState.emergencyPauseReason = reason
    automationState.emergencyPauseTimestamp = new Date().toISOString()

    // Pause all contracts
    for (const [networkName, config] of Object.entries(PRODUCTION_CONFIG.networks)) {
      const miningContract = contracts.get(`${networkName}:mining`)
      if (miningContract) {
        const provider = providers.get(networkName)!
        const signer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider)
        const miningWithSigner = miningContract.connect(signer)

        const tx = await miningWithSigner.emergencyPause()
        await tx.wait(2)
        console.log(`🚨 Emergency pause activated on ${networkName}`)
      }
    }

    await saveAutomationState()
    await sendAlert('emergency_pause', `Emergency pause activated: ${reason}`, {
      reason,
      timestamp: automationState.emergencyPauseTimestamp
    })

  } catch (error) {
    console.error('❌ Emergency pause failed:', error)
    await logError('emergency_pause_failed', error)
  }
}

// Utility functions
async function saveAutomationState() {
  await redis.set('miner:automation:state', JSON.stringify(automationState))
}

async function logError(type: string, error: any) {
  const errorData = {
    type,
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  }

  await redis.setex(`miner:errors:${Date.now()}`, 604800, JSON.stringify(errorData)) // 7 days
}

async function sendAlert(type: string, message: string, data?: any) {
  const alert = {
    type,
    message,
    data,
    timestamp: new Date().toISOString(),
    severity: type.includes('emergency') ? 'critical' : 'warning'
  }

  console.log(`🚨 ALERT [${type.toUpperCase()}]: ${message}`)

  // Save alert
  await redis.setex(`miner:alerts:${Date.now()}`, 604800, JSON.stringify(alert))

  // In production, integrate with alerting systems (PagerDuty, Slack, etc.)
  // await sendToSlack(alert)
  // await sendToPagerDuty(alert)
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down automation system...')

  if (redis) {
    await redis.quit()
  }

  console.log('✅ Automation system stopped gracefully')
  process.exit(0)
})

// Start automation
if (require.main === module) {
  initializeAutomation().catch((error) => {
    console.error('❌ Failed to initialize automation:', error)
    process.exit(1)
  })
}

export {
  initializeAutomation,
  performHealthChecks,
  distributeRewards,
  checkBuybackConditions,
  generateTreasuryReport,
  activateEmergencyPause
}