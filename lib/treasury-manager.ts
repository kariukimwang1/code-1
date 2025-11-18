import { query } from "./database"

/**
 * Treasury Manager - Handles buyback operations and token stability
 * Converts platform fees into MINER token buybacks
 */

export interface TreasuryMetrics {
  totalFeeAccumulated: number
  buybackBudget: number
  availableForBuyback: number
  lastBuybackAmount: number
  lastBuybackTime: Date
  priceFloor: number
  currentPrice: number
  buybacksExecuted: number
}

const BUYBACK_THRESHOLD = 1000 // Execute buyback when accumulated fees reach $1000
const LP_PROVISION_PERCENTAGE = 30 // 30% of fees go to LP

export async function getTreasuryMetrics(): Promise<TreasuryMetrics> {
  const result = await query(
    `SELECT 
      SUM(amount) as total_fees,
      COUNT(*) as fee_count,
      MAX(created_at) as last_fee_time
     FROM treasury_fees WHERE status = 'active'`,
  )

  const buybackResult = await query(
    `SELECT 
      SUM(CASE WHEN status = 'executed' THEN amount ELSE 0 END) as total_buyback,
      COUNT(CASE WHEN status = 'executed' THEN 1 END) as buyback_count,
      MAX(CASE WHEN status = 'executed' THEN amount ELSE 0 END) as last_amount
     FROM buyback_operations`,
  )

  const totalFees = Number.parseFloat(result.rows[0]?.total_fees) || 0
  const buybackBudget = totalFees * (500 / 10000) // 5% allocation
  const lpBudget = totalFees * (LP_PROVISION_PERCENTAGE / 100)
  const availableForBuyback = buybackBudget - lpBudget

  return {
    totalFeeAccumulated: totalFees,
    buybackBudget,
    availableForBuyback,
    lastBuybackAmount: Number.parseFloat(buybackResult.rows[0]?.last_amount) || 0,
    lastBuybackTime: new Date(buybackResult.rows[0]?.max || Date.now()),
    priceFloor: 0.001, // $0.001 minimum price floor
    currentPrice: 0.0015, // Current market price
    buybacksExecuted: Number.parseInt(buybackResult.rows[0]?.buyback_count) || 0,
  }
}

export async function executeBuyback(
  usdcAmount: number,
  pricePerToken: number,
): Promise<{
  buybackId: string
  tokensAcquired: number
  usdcSpent: number
  status: string
}> {
  // Calculate tokens to acquire
  const tokensToAcquire = usdcAmount / pricePerToken

  // Record buyback operation
  const result = await query(
    `INSERT INTO buyback_operations 
     (usdc_amount, tokens_acquired, price_per_token, status, execution_date)
     VALUES ($1, $2, $3, 'executed', NOW())
     RETURNING id, usdc_amount, tokens_acquired, status`,
    [usdcAmount, tokensToAcquire, pricePerToken],
  )

  const buyback = result.rows[0]

  // Update treasury fees as processed
  await query(
    `UPDATE treasury_fees 
     SET status = 'processed_buyback', buyback_operation_id = $1
     WHERE status = 'active' AND created_at <= (NOW() - INTERVAL '1 hour')
     LIMIT (SELECT COUNT(*) * 0.5 FROM treasury_fees WHERE status = 'active')`,
    [buyback.id],
  )

  // Emit event for off-chain execution
  console.log(`[Treasury] Buyback executed: ${tokensToAcquire} tokens for $${usdcAmount}`)

  return {
    buybackId: buyback.id,
    tokensAcquired: Number.parseFloat(buyback.tokens_acquired),
    usdcSpent: Number.parseFloat(buyback.usdc_amount),
    status: buyback.status,
  }
}

export async function provideLiquidity(
  tokenAmount: number,
  usdcAmount: number,
): Promise<{
  lpId: string
  tokensProvided: number
  usdcProvided: number
  lpTokensReceived: number
  status: string
}> {
  // Calculate LP tokens received (simplified)
  const lpTokensReceived = Math.sqrt(tokenAmount * usdcAmount)

  const result = await query(
    `INSERT INTO liquidity_provisions 
     (token_amount, usdc_amount, lp_tokens_received, status, provision_date)
     VALUES ($1, $2, $3, 'active', NOW())
     RETURNING id, token_amount, usdc_amount, lp_tokens_received, status`,
    [tokenAmount, usdcAmount, lpTokensReceived],
  )

  const lp = result.rows[0]

  return {
    lpId: lp.id,
    tokensProvided: Number.parseFloat(lp.token_amount),
    usdcProvided: Number.parseFloat(lp.usdc_amount),
    lpTokensReceived: Number.parseFloat(lp.lp_tokens_received),
    status: lp.status,
  }
}

export async function calculateOptimalBuybackPrice(): Promise<number> {
  // Get historical price data
  const result = await query(
    `SELECT 
      AVG(price) as avg_price,
      MIN(price) as min_price,
      MAX(price) as max_price
     FROM price_history 
     WHERE recorded_at > NOW() - INTERVAL '7 days'`,
  )

  if (result.rows.length === 0) return 0.001

  const avgPrice = Number.parseFloat(result.rows[0].avg_price) || 0.001
  const minPrice = Number.parseFloat(result.rows[0].min_price) || 0.0005

  // Buy when price is 20% below average (good opportunity)
  const buyPrice = avgPrice * 0.8

  return Math.max(minPrice, buyPrice)
}

export async function recordTreasuryFee(
  source: string,
  amount: number,
  feeType: string,
): Promise<{
  feeId: string
  amount: number
  source: string
}> {
  const result = await query(
    `INSERT INTO treasury_fees (source, amount, fee_type, status)
     VALUES ($1, $2, $3, 'active')
     RETURNING id, amount, source`,
    [source, amount, feeType],
  )

  return {
    feeId: result.rows[0].id,
    amount: Number.parseFloat(result.rows[0].amount),
    source: result.rows[0].source,
  }
}

export async function checkAndExecuteAutoBuyback(): Promise<boolean> {
  const metrics = await getTreasuryMetrics()

  if (metrics.availableForBuyback < BUYBACK_THRESHOLD) {
    return false // Not enough accumulated
  }

  const optimalPrice = await calculateOptimalBuybackPrice()
  const currentPrice = metrics.currentPrice

  if (currentPrice > optimalPrice) {
    return false // Price too high, wait for better opportunity
  }

  // Execute buyback
  const buybackAmount = Math.min(metrics.availableForBuyback, BUYBACK_THRESHOLD)
  await executeBuyback(buybackAmount, currentPrice)

  return true
}
