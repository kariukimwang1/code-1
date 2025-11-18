import crypto from "crypto"
import type { Pool } from "pg"

export interface PayPalWebhookEvent {
  id: string
  create_time: string
  resource_type: string
  event_type: string
  summary: string
  resource: Record<string, any>
}

export class PayPalManager {
  private pool: Pool
  private clientId: string
  private clientSecret: string
  private webhookId: string

  constructor(pool: Pool) {
    this.pool = pool
    this.clientId = process.env.PAYPAL_CLIENT_ID || ""
    this.clientSecret = process.env.PAYPAL_CLIENT_SECRET || ""
    this.webhookId = process.env.PAYPAL_WEBHOOK_ID || ""
  }

  async handleWebhookEvent(event: PayPalWebhookEvent): Promise<void> {
    console.log("[v0] PayPal webhook event:", event.event_type)

    switch (event.event_type) {
      case "PAYMENT.PAYOUTSBATCH.SUCCESS":
        await this.handlePayoutSuccess(event)
        break
      case "PAYMENT.PAYOUTSBATCH.FAILED":
        await this.handlePayoutFailure(event)
        break
      case "PAYMENT.CAPTURE.COMPLETED":
        await this.handlePaymentCompleted(event)
        break
      default:
        console.log("[v0] Unhandled event:", event.event_type)
    }
  }

  private async handlePayoutSuccess(event: PayPalWebhookEvent): Promise<void> {
    const { batch_header } = event.resource

    // Update withdrawal status
    await this.pool.query(
      `UPDATE withdrawals 
       SET status = 'completed', processed_at = NOW()
       WHERE tx_ref = $1`,
      [batch_header.payout_batch_id],
    )
  }

  private async handlePayoutFailure(event: PayPalWebhookEvent): Promise<void> {
    const { batch_header } = event.resource

    // Mark as failed and update user balance
    const withdrawal = await this.pool.query(`SELECT user_id, amount_usd FROM withdrawals WHERE tx_ref = $1`, [
      batch_header.payout_batch_id,
    ])

    if (withdrawal.rows.length > 0) {
      const { user_id, amount_usd } = withdrawal.rows[0]

      // Refund tokens to user
      await this.pool.query(
        `UPDATE user_balances 
         SET token_balance = token_balance + $1 
         WHERE user_id = $2`,
        [amount_usd, user_id],
      )

      // Update withdrawal status
      await this.pool.query(
        `UPDATE withdrawals 
         SET status = 'failed'
         WHERE tx_ref = $1`,
        [batch_header.payout_batch_id],
      )
    }
  }

  private async handlePaymentCompleted(event: PayPalWebhookEvent): Promise<void> {
    console.log("[v0] Payment completed:", event.resource)
  }

  async registerWebhook(url: string): Promise<string> {
    const accessToken = await this.getAccessToken()

    const response = await fetch("https://api.sandbox.paypal.com/v1/notifications/webhooks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        url,
        event_types: [
          {
            name: "PAYMENT.PAYOUTSBATCH.SUCCESS",
          },
          {
            name: "PAYMENT.PAYOUTSBATCH.FAILED",
          },
          {
            name: "PAYMENT.CAPTURE.COMPLETED",
          },
        ],
      }),
    })

    const data = await response.json()
    return data.id
  }

  private async getAccessToken(): Promise<string> {
    const response = await fetch("https://api.sandbox.paypal.com/v1/oauth2/token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-Language": "en_US",
        Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64")}`,
      },
      body: "grant_type=client_credentials",
    })

    const data = await response.json()
    return data.access_token
  }

  verifyWebhookSignature(
    webhookId: string,
    eventId: string,
    signatureHeader: string,
    transmissionId: string,
    transmissionTime: string,
  ): boolean {
    const expectedSig = crypto
      .createHmac("sha256", this.webhookId)
      .update(`${transmissionId}|${transmissionTime}|${webhookId}|${eventId}`)
      .digest("base64")

    return expectedSig === signatureHeader
  }
}

export default PayPalManager
