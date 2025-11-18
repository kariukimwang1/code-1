import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { query } from "@/lib/database"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20'
})

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = headers().get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing Stripe signature' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent)
        break

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent)
        break

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case 'account.updated':
        await handleAccountUpdated(event.data.object as Stripe.Account)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    const userId = paymentIntent.metadata?.userId
    const amount = paymentIntent.amount
    const currency = paymentIntent.currency

    if (!userId) {
      console.error('PaymentIntent missing userId metadata')
      return
    }

    // Convert amount from cents to dollars
    const amountUSD = amount ? amount / 100 : 0

    // Update user balance
    await query(
      `UPDATE user_balances
       SET usdc_balance = usdc_balance + $1,
           updated_at = NOW()
       WHERE user_id = $2`,
      [amountUSD, userId]
    )

    // Record transaction
    await query(
      `INSERT INTO transactions (user_id, type, amount, amount_usd, currency, status, description, stripe_payment_intent_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [
        userId,
        'deposit',
        amountUSD,
        amountUSD,
        currency?.toUpperCase() || 'USD',
        'completed',
        `Stripe payment: ${paymentIntent.id}`,
        paymentIntent.id
      ]
    )

    console.log(`Payment succeeded: ${amountUSD} ${currency} for user ${userId}`)

  } catch (error) {
    console.error('Error handling payment succeeded:', error)
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    const userId = paymentIntent.metadata?.userId

    if (!userId) {
      console.error('PaymentIntent missing userId metadata')
      return
    }

    // Record failed transaction
    await query(
      `INSERT INTO transactions (user_id, type, amount, amount_usd, currency, status, description, stripe_payment_intent_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [
        userId,
        'deposit',
        0,
        0,
        'USD',
        'failed',
        `Failed Stripe payment: ${paymentIntent.last_payment_error?.message || 'Unknown error'}`,
        paymentIntent.id
      ]
    )

    console.log(`Payment failed for user ${userId}: ${paymentIntent.last_payment_error?.message}`)

  } catch (error) {
    console.error('Error handling payment failed:', error)
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    const customerId = invoice.customer as string
    const amountPaid = invoice.amount_paid

    // Find user by Stripe customer ID
    const userResult = await query(
      "SELECT id FROM users WHERE stripe_customer_id = $1",
      [customerId]
    )

    if (userResult.rows.length === 0) {
      console.error(`No user found for Stripe customer: ${customerId}`)
      return
    }

    const userId = userResult.rows[0].id
    const amountUSD = amountPaid ? amountPaid / 100 : 0

    // Update user balance
    await query(
      `UPDATE user_balances
       SET usdc_balance = usdc_balance + $1,
           updated_at = NOW()
       WHERE user_id = $2`,
      [amountUSD, userId]
    )

    // Record transaction
    await query(
      `INSERT INTO transactions (user_id, type, amount, amount_usd, currency, status, description, stripe_invoice_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [
        userId,
        'subscription_payment',
        amountUSD,
        amountUSD,
        invoice.currency || 'USD',
        'completed',
        `Subscription payment: ${invoice.id}`,
        invoice.id
      ]
    )

    console.log(`Invoice payment succeeded: ${amountUSD} for user ${userId}`)

  } catch (error) {
    console.error('Error handling invoice payment succeeded:', error)
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  try {
    const customerId = subscription.customer as string

    // Find user by Stripe customer ID
    const userResult = await query(
      "SELECT id FROM users WHERE stripe_customer_id = $1",
      [customerId]
    )

    if (userResult.rows.length === 0) {
      console.error(`No user found for Stripe customer: ${customerId}`)
      return
    }

    const userId = userResult.rows[0].id

    // Record subscription
    await query(
      `INSERT INTO subscriptions (user_id, stripe_subscription_id, status, plan_id, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (stripe_subscription_id)
       DO UPDATE SET
         status = EXCLUDED.status,
         updated_at = NOW()`,
      [
        userId,
        subscription.id,
        subscription.status,
        subscription.items.data[0]?.price?.id || null
      ]
    )

    console.log(`Subscription created: ${subscription.id} for user ${userId}`)

  } catch (error) {
    console.error('Error handling subscription created:', error)
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    // Update subscription status in database
    await query(
      `UPDATE subscriptions
       SET status = $1, updated_at = NOW()
       WHERE stripe_subscription_id = $2`,
      ['canceled', subscription.id]
    )

    console.log(`Subscription deleted: ${subscription.id}`)

  } catch (error) {
    console.error('Error handling subscription deleted:', error)
  }
}

async function handleAccountUpdated(account: Stripe.Account) {
  try {
    const accountId = account.id

    // Update account verification status
    await query(
      `UPDATE payment_providers
       SET verified = $1, account_data = $2, updated_at = NOW()
       WHERE provider_id = $3 AND provider_type = 'stripe'`,
      [
        account.payouts_enabled || false,
        JSON.stringify(account),
        accountId
      ]
    )

    console.log(`Stripe account updated: ${accountId}`)

  } catch (error) {
    console.error('Error handling account updated:', error)
  }
}