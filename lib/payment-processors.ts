import Stripe from "stripe"
import crypto from "crypto"
import type { Pool } from "pg"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-11-20",
})

export interface WithdrawalRequest {
  userId: string
  amount: number
  currency: "KES" | "USD"
  method: "paypal" | "stripe"
  recipientEmail?: string
  accountId?: string
}

export interface PaymentResult {
  success: boolean
  transactionId: string
  amount: number
  status: string
  method: string
  timestamp: Date
  error?: string
}

export class PaymentProcessor {
  private pool: Pool

  constructor(pool: Pool) {
    this.pool = pool
  }

  async processStripePayout(request: WithdrawalRequest): Promise<PaymentResult> {
    try {
      // Create connected account or use existing
      let accountId = request.accountId

      if (!accountId) {
        // Create account for user if not exists
        const existing = await this.pool.query(
          `SELECT stripe_account_id FROM user_payment_accounts 
           WHERE user_id = $1 AND provider = 'stripe'`,
          [request.userId],
        )

        if (existing.rows.length > 0) {
          accountId = existing.rows[0].stripe_account_id
        } else {
          // Create new connected account
          const account = await stripe.accounts.create({
            type: "express",
            email: request.recipientEmail,
            country: "KE", // Kenya
          })
          accountId = account.id

          // Store account mapping
          await this.pool.query(
            `INSERT INTO user_payment_accounts (user_id, provider, account_id, provider_account_id)
             VALUES ($1, $2, $3, $4)`,
            [request.userId, "stripe", crypto.randomUUID(), accountId],
          )
        }
      }

      // Create payout
      const payout = await stripe.payouts.create(
        {
          amount: Math.floor(request.amount * 100), // Convert to cents
          currency: request.currency === "USD" ? "usd" : "kes",
          method: "instant",
        },
        { stripeAccount: accountId },
      )

      // Record transaction
      const result: PaymentResult = {
        success: payout.status === "succeeded" || payout.status === "in_transit",
        transactionId: payout.id,
        amount: request.amount,
        status: payout.status,
        method: "stripe",
        timestamp: new Date(),
      }

      await this.recordTransaction(request.userId, result)

      return result
    } catch (error) {
      console.error("[v0] Stripe payout error:", error)
      return {
        success: false,
        transactionId: "",
        amount: request.amount,
        status: "failed",
        method: "stripe",
        timestamp: new Date(),
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  async processPayPalPayout(request: WithdrawalRequest): Promise<PaymentResult> {
    try {
      const accessToken = await this.getPayPalAccessToken()

      // Convert KES to USD if needed
      let usdAmount = request.amount
      if (request.currency === "KES") {
        const exchangeRate = await this.getExchangeRate("KES", "USD")
        usdAmount = request.amount / exchangeRate
      }

      // Create batch payout item
      const response = await fetch("https://api.sandbox.paypal.com/v1/payments/payouts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          sender_batch_header: {
            sender_batch_id: crypto.randomUUID(),
            email_subject: "MINER Token Withdrawal",
            email_message: "You have received a payout from MINER platform",
          },
          items: [
            {
              recipient_type: "EMAIL",
              amount: {
                value: usdAmount.toFixed(2),
                currency: "USD",
              },
              description: "MINER platform withdrawal",
              receiver: request.recipientEmail,
              note: "Token withdrawal",
            },
          ],
        }),
      })

      const data = await response.json()

      if (response.ok && data.batch_header) {
        const result: PaymentResult = {
          success: true,
          transactionId: data.batch_header.payout_batch_id,
          amount: request.amount,
          status: "processing",
          method: "paypal",
          timestamp: new Date(),
        }

        await this.recordTransaction(request.userId, result)
        return result
      } else {
        throw new Error(data.message || "PayPal payout failed")
      }
    } catch (error) {
      console.error("[v0] PayPal payout error:", error)
      return {
        success: false,
        transactionId: "",
        amount: request.amount,
        status: "failed",
        method: "paypal",
        timestamp: new Date(),
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  private async getPayPalAccessToken(): Promise<string> {
    const response = await fetch("https://api.sandbox.paypal.com/v1/oauth2/token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-Language": "en_US",
        Authorization: `Basic ${Buffer.from(
          `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`,
        ).toString("base64")}`,
      },
      body: "grant_type=client_credentials",
    })

    const data = await response.json()
    return data.access_token
  }

  private async getExchangeRate(from: string, to: string): Promise<number> {
    // Default rate for KES to USD (approximately 130 KES = 1 USD)
    if (from === "KES" && to === "USD") return 130
    return 1
  }

  async processWithdrawal(request: WithdrawalRequest): Promise<PaymentResult> {
    // Validate user has sufficient balance
    const userBalance = await this.pool.query(`SELECT token_balance FROM user_balances WHERE user_id = $1`, [
      request.userId,
    ])

    if (!userBalance.rows[0] || userBalance.rows[0].token_balance < request.amount) {
      return {
        success: false,
        transactionId: "",
        amount: request.amount,
        status: "insufficient_balance",
        method: request.method,
        timestamp: new Date(),
        error: "Insufficient balance",
      }
    }

    let result: PaymentResult

    if (request.method === "stripe") {
      result = await this.processStripePayout(request)
    } else {
      result = await this.processPayPalPayout(request)
    }

    // Deduct from balance if successful
    if (result.success) {
      await this.pool.query(
        `UPDATE user_balances 
         SET token_balance = token_balance - $1 
         WHERE user_id = $2`,
        [request.amount, request.userId],
      )
    }

    return result
  }

  private async recordTransaction(userId: string, result: PaymentResult): Promise<void> {
    await this.pool.query(
      `INSERT INTO withdrawals 
       (id, user_id, amount_usd, payout_method, status, tx_ref)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        crypto.randomUUID(),
        userId,
        result.amount,
        result.method,
        result.success ? "completed" : "failed",
        result.transactionId,
      ],
    )
  }

  async createPaymentAccount(userId: string, method: "paypal" | "stripe", email: string): Promise<void> {
    await this.pool.query(
      `INSERT INTO user_payment_accounts 
       (id, user_id, provider, email, created_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, provider) DO UPDATE SET email = $4`,
      [crypto.randomUUID(), userId, method, email, new Date()],
    )
  }

  async getWithdrawalHistory(userId: string, limit = 10): Promise<any[]> {
    const result = await this.pool.query(
      `SELECT * FROM withdrawals 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [userId, limit],
    )
    return result.rows
  }
}

export default PaymentProcessor
