import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

interface PayPalWebhookEvent {
  id: string
  event_version: string
  create_time: string
  resource_type: string
  event_type: string
  summary: string
  resource: any
  links: any[]
}

interface PayPalPayout {
  sender_batch_id: string
  payout_batch_id: string
  payout_item_id: string
  transaction_id?: string
  payout_item: {
    recipient_type: string
    amount: {
      value: string
      currency: string
    }
    receiver: string
    note?: string
    sender_item_id: string
  }
  time_processed: string
  payout_status: string
}

interface PayPalPayment {
  id: string
  status: string
  amount: {
    total: string
    currency: string
  }
  payer: {
    email_address: string
    payer_id: string
  }
  create_time: string
  update_time: string
}

async function verifyPayPalWebhook(req: NextRequest): Promise<boolean> {
  try {
    const headers = req.headers
    const paypalAuthAlgo = headers.get('paypal-auth-algo')
    const paypalTransmissionId = headers.get('paypal-transmission-id')
    const paypalCertId = headers.get('paypal-cert-id')
    const paypalTransmissionSig = headers.get('paypal-transmission-sig')
    const paypalTransmissionTime = headers.get('paypal-transmission-time')

    if (!paypalAuthAlgo || !paypalTransmissionId || !paypalCertId ||
        !paypalTransmissionSig || !paypalTransmissionTime) {
      return false
    }

    // In production, verify with PayPal SDK
    // For now, we'll do basic validation
    const body = await req.text()

    // TODO: Implement actual PayPal webhook verification
    // const paypal = require('@paypal/checkout-server-sdk')
    // const verifyWebhookSignature = paypal.core.verifyWebhookSignature(
    //   body,
    //   paypalAuthAlgo,
    //   paypalTransmissionId,
    //   paypalCertId,
    //   paypalTransmissionSig,
    //   paypalTransmissionTime,
    //   process.env.PAYPAL_WEBHOOK_ID
    // )

    return true // Temporary - implement actual verification

  } catch (error) {
    console.error('PayPal webhook verification error:', error)
    return false
  }
}

export async function POST(req: NextRequest) {
  try {
    // Verify webhook signature
    const isValid = await verifyPayPalWebhook(req)

    if (!isValid) {
      console.error('Invalid PayPal webhook signature')
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      )
    }

    const body = await req.text()
    const event: PayPalWebhookEvent = JSON.parse(body)

    console.log(`PayPal webhook event: ${event.event_type}`)

    switch (event.event_type) {
      case 'PAYMENT.SALE.COMPLETED':
        await handlePaymentCompleted(event.resource as PayPalPayment)
        break

      case 'PAYMENT.SALE.DENIED':
        await handlePaymentDenied(event.resource as PayPalPayment)
        break

      case 'PAYMENT.SALE.REFUNDED':
        await handlePaymentRefunded(event.resource as PayPalPayment)
        break

      case 'PAYOUT.ITEM.COMPLETED':
        await handlePayoutCompleted(event.resource as PayPalPayout)
        break

      case 'PAYOUT.ITEM.DENIED':
        await handlePayoutDenied(event.resource as PayPalPayout)
        break

      case 'PAYOUT.ITEM.FAILED':
        await handlePayoutFailed(event.resource as PayPalPayout)
        break

      default:
        console.log(`Unhandled PayPal event type: ${event.event_type}`)
    }

    return NextResponse.json({ status: 'success' })

  } catch (error) {
    console.error('Error processing PayPal webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handlePaymentCompleted(payment: PayPalPayment) {
  try {
    // Find withdrawal associated with this payment
    const withdrawalResult = await query(
      `SELECT id, user_id, amount_usd FROM withdrawals
       WHERE status = 'processing' AND paypal_email = $1
       ORDER BY created_at DESC LIMIT 1`,
      [payment.payer.email_address]
    )

    if (withdrawalResult.rows.length === 0) {
      console.log(`No matching withdrawal found for PayPal payment: ${payment.id}`)
      return
    }

    const withdrawal = withdrawalResult.rows[0]

    // Update withdrawal status
    await query(
      `UPDATE withdrawals
       SET status = 'paid',
           processed_at = NOW(),
           transaction_id = $1,
           paypal_transaction_id = $2
       WHERE id = $3`,
      [payment.id, payment.id, withdrawal.id]
    )

    // Deduct from user balance
    await query(
      `UPDATE user_balances
       SET usdc_balance = usdc_balance - $1,
           updated_at = NOW()
       WHERE user_id = $2`,
      [withdrawal.amount_usd, withdrawal.user_id]
    )

    // Record transaction
    await query(
      `INSERT INTO transactions (user_id, type, amount, amount_usd, currency, status, description, paypal_transaction_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [
        withdrawal.user_id,
        'withdrawal',
        -withdrawal.amount_usd,
        withdrawal.amount_usd,
        payment.amount.currency,
        'completed',
        `PayPal withdrawal: ${payment.id}`,
        payment.id
      ]
    )

    console.log(`PayPal payment completed: ${payment.amount.total} ${payment.amount.currency} for withdrawal ${withdrawal.id}`)

  } catch (error) {
    console.error('Error handling PayPal payment completed:', error)
  }
}

async function handlePaymentDenied(payment: PayPalPayment) {
  try {
    // Find withdrawal associated with this payment
    const withdrawalResult = await query(
      `SELECT id, user_id FROM withdrawals
       WHERE status = 'processing' AND paypal_email = $1
       ORDER BY created_at DESC LIMIT 1`,
      [payment.payer.email_address]
    )

    if (withdrawalResult.rows.length === 0) {
      console.log(`No matching withdrawal found for denied PayPal payment: ${payment.id}`)
      return
    }

    const withdrawal = withdrawalResult.rows[0]

    // Update withdrawal status
    await query(
      `UPDATE withdrawals
       SET status = 'failed',
           processed_at = NOW(),
           error_message = 'PayPal payment denied'
       WHERE id = $1`,
      [withdrawal.id]
    )

    console.log(`PayPal payment denied for withdrawal ${withdrawal.id}`)

  } catch (error) {
    console.error('Error handling PayPal payment denied:', error)
  }
}

async function handlePaymentRefunded(payment: PayPalPayment) {
  try {
    // Find transaction associated with this refund
    const transactionResult = await query(
      `SELECT user_id, amount_usd FROM transactions
       WHERE paypal_transaction_id = $1 AND type = 'withdrawal'`,
      [payment.id]
    )

    if (transactionResult.rows.length === 0) {
      console.log(`No matching transaction found for PayPal refund: ${payment.id}`)
      return
    }

    const transaction = transactionResult.rows[0]

    // Add refunded amount back to user balance
    await query(
      `UPDATE user_balances
       SET usdc_balance = usdc_balance + $1,
           updated_at = NOW()
       WHERE user_id = $2`,
      [transaction.amount_usd, transaction.user_id]
    )

    // Record refund transaction
    await query(
      `INSERT INTO transactions (user_id, type, amount, amount_usd, currency, status, description, paypal_transaction_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [
        transaction.user_id,
        'refund',
        transaction.amount_usd,
        transaction.amount_usd,
        payment.amount.currency,
        'completed',
        `PayPal refund: ${payment.id}`,
        payment.id
      ]
    )

    console.log(`PayPal refund processed: ${payment.amount.total} ${payment.amount.currency}`)

  } catch (error) {
    console.error('Error handling PayPal refund:', error)
  }
}

async function handlePayoutCompleted(payout: PayPalPayout) {
  try {
    const amount = parseFloat(payout.payout_item.amount.value)
    const currency = payout.payout_item.amount.currency
    const recipient = payout.payout_item.receiver
    const senderItemId = payout.payout_item.sender_item_id

    // Find withdrawal associated with this payout
    const withdrawalResult = await query(
      `SELECT id, user_id FROM withdrawals
       WHERE paypal_email = $1 AND status = 'approved'
       ORDER BY created_at DESC LIMIT 1`,
      [recipient]
    )

    if (withdrawalResult.rows.length === 0) {
      console.log(`No matching withdrawal found for PayPal payout: ${payout.payout_item_id}`)
      return
    }

    const withdrawal = withdrawalResult.rows[0]

    // Update withdrawal status
    await query(
      `UPDATE withdrawals
       SET status = 'paid',
           processed_at = NOW(),
           paypal_payout_id = $1,
           transaction_id = $2
       WHERE id = $3`,
      [payout.payout_item_id, payout.transaction_id, withdrawal.id]
    )

    // Record transaction
    await query(
      `INSERT INTO transactions (user_id, type, amount, amount_usd, currency, status, description, paypal_payout_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [
        withdrawal.user_id,
        'withdrawal',
        -amount,
        amount,
        currency,
        'completed',
        `PayPal payout: ${payout.payout_item_id}`,
        payout.payout_item_id
      ]
    )

    console.log(`PayPal payout completed: ${amount} ${currency} to ${recipient}`)

  } catch (error) {
    console.error('Error handling PayPal payout completed:', error)
  }
}

async function handlePayoutDenied(payout: PayPalPayout) {
  try {
    const recipient = payout.payout_item.receiver

    // Find withdrawal associated with this payout
    const withdrawalResult = await query(
      `SELECT id FROM withdrawals
       WHERE paypal_email = $1 AND status = 'approved'
       ORDER BY created_at DESC LIMIT 1`,
      [recipient]
    )

    if (withdrawalResult.rows.length === 0) {
      console.log(`No matching withdrawal found for denied PayPal payout: ${payout.payout_item_id}`)
      return
    }

    const withdrawal = withdrawalResult.rows[0]

    // Update withdrawal status
    await query(
      `UPDATE withdrawals
       SET status = 'failed',
           processed_at = NOW(),
           error_message = 'PayPal payout denied'
       WHERE id = $1`,
      [withdrawal.id]
    )

    console.log(`PayPal payout denied for withdrawal ${withdrawal.id}`)

  } catch (error) {
    console.error('Error handling PayPal payout denied:', error)
  }
}

async function handlePayoutFailed(payout: PayPalPayout) {
  try {
    const recipient = payout.payout_item.receiver

    // Find withdrawal associated with this payout
    const withdrawalResult = await query(
      `SELECT id FROM withdrawals
       WHERE paypal_email = $1 AND status = 'approved'
       ORDER BY created_at DESC LIMIT 1`,
      [recipient]
    )

    if (withdrawalResult.rows.length === 0) {
      console.log(`No matching withdrawal found for failed PayPal payout: ${payout.payout_item_id}`)
      return
    }

    const withdrawal = withdrawalResult.rows[0]

    // Update withdrawal status
    await query(
      `UPDATE withdrawals
       SET status = 'failed',
           processed_at = NOW(),
           error_message = 'PayPal payout failed'
       WHERE id = $1`,
      [withdrawal.id]
    )

    console.log(`PayPal payout failed for withdrawal ${withdrawal.id}`)

  } catch (error) {
    console.error('Error handling PayPal payout failed:', error)
  }
}