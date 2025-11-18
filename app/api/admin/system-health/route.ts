import { NextRequest, NextResponse } from "next/server"
import { getAuth } from "@/lib/auth"
import { query } from "@/lib/database"
import { getContractAutomation } from "@/lib/contract-automation"

interface SystemHealth {
  uptime: number
  responseTime: number
  errorRate: number
  activeConnections: number
  databaseStatus: string
  blockchainStatus: string
  contractBalances: any
  treasuryMetrics: any
  lastHourTransactions: number
  errorMessages: string[]
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAuth(req)
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const startTime = Date.now()

    // Collect system health metrics
    const [
      databaseStatus,
      activeConnections,
      errorCount,
      transactionCount,
      blockchainStatus,
      contractBalances,
      treasuryMetrics
    ] = await Promise.all([
      getDatabaseHealth(),
      getActiveConnections(),
      getErrorRate(),
      getTransactionCount(),
      getBlockchainHealth(),
      getContractBalances(),
      getTreasuryMetrics()
    ])

    const responseTime = Date.now() - startTime

    const systemHealth: SystemHealth = {
      uptime: calculateUptime(),
      responseTime,
      errorRate: transactionCount > 0 ? (errorCount / transactionCount) * 100 : 0,
      activeConnections,
      databaseStatus,
      blockchainStatus,
      contractBalances,
      treasuryMetrics,
      lastHourTransactions: transactionCount,
      errorMessages: []
    }

    return NextResponse.json(systemHealth)

  } catch (error) {
    console.error("Error getting system health:", error)
    return NextResponse.json(
      { error: "Failed to get system health" },
      { status: 500 }
    )
  }
}

async function getDatabaseHealth(): Promise<string> {
  try {
    const result = await query("SELECT NOW() as current_time")
    return "healthy"
  } catch (error) {
    console.error("Database health check failed:", error)
    return "unhealthy"
  }
}

async function getActiveConnections(): Promise<number> {
  try {
    // This would typically come from your server monitoring
    // For now, return a simulated value
    const result = await query("SELECT COUNT(*) as count FROM user_sessions WHERE last_activity > NOW() - INTERVAL '5 minutes'")
    return parseInt(result.rows[0]?.count || "0")
  } catch (error) {
    console.error("Active connections check failed:", error)
    return 0
  }
}

async function getErrorRate(): Promise<number> {
  try {
    // Get error count from last hour
    const result = await query(
      `SELECT COUNT(*) as count FROM error_logs
       WHERE created_at > NOW() - INTERVAL '1 hour'`
    )
    return parseInt(result.rows[0]?.count || "0")
  } catch (error) {
    console.error("Error rate check failed:", error)
    return 0
  }
}

async function getTransactionCount(): Promise<number> {
  try {
    const result = await query(
      `SELECT COUNT(*) as count FROM transactions
       WHERE created_at > NOW() - INTERVAL '1 hour'`
    )
    return parseInt(result.rows[0]?.count || "0")
  } catch (error) {
    console.error("Transaction count check failed:", error)
    return 0
  }
}

async function getBlockchainHealth(): Promise<string> {
  try {
    const automation = getContractAutomation(1) // Ethereum
    const health = await automation.monitorSystemHealth()
    return health.isConnected ? "healthy" : "unhealthy"
  } catch (error) {
    console.error("Blockchain health check failed:", error)
    return "unhealthy"
  }
}

async function getContractBalances(): Promise<any> {
  try {
    const automation = getContractAutomation(1) // Ethereum
    const balances = await automation.getContractBalances()
    return balances
  } catch (error) {
    console.error("Contract balances check failed:", error)
    return null
  }
}

async function getTreasuryMetrics(): Promise<any> {
  try {
    const automation = getContractAutomation(1) // Ethereum
    const metrics = await automation.getTreasuryMetrics()
    return metrics
  } catch (error) {
    console.error("Treasury metrics check failed:", error)
    return null
  }
}

function calculateUptime(): number {
  // In production, this would come from your server monitoring
  // For now, return a simulated uptime
  return 99.8
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuth(req)
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { action } = await req.json()

    let result: any = {}

    switch (action) {
      case "buyback":
        const automation = getContractAutomation(1)
        result = await automation.executeBuyback(1000) // Execute 1000 token buyback
        break

      case "burn":
        const burnAutomation = getContractAutomation(1)
        result = await burnAutomation.burnTokens(500) // Burn 500 tokens
        break

      case "distributeRewards":
        const rewardAutomation = getContractAutomation(1)
        result = await rewardAutomation.distributeRewards()
        break

      case "updateOracle":
        const oracleAutomation = getContractAutomation(1)
        result = await oracleAutomation.updateOraclePrices(1.50, 120)
        break

      case "pause":
        const pauseAutomation = getContractAutomation(1)
        result = await pauseAutomation.emergencyPause()
        break

      case "resume":
        const resumeAutomation = getContractAutomation(1)
        result = await resumeAutomation.emergencyResume()
        break

      default:
        return NextResponse.json(
          { error: "Unknown action" },
          { status: 400 }
        )
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error("Error executing system health action:", error)
    return NextResponse.json(
      { error: "Failed to execute action" },
      { status: 500 }
    )
  }
}