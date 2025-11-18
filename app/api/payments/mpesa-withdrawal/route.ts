import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const MPESA_CONFIG = {
  consumerKey: process.env.MPESA_CONSUMER_KEY!,
  consumerSecret: process.env.MPESA_CONSUMER_SECRET!,
  shortcode: process.env.MPESA_SHORTCODE!,
  passkey: process.env.MPESA_PASSKEY!,
  environment: process.env.MPESA_ENVIRONMENT || 'sandbox',
  initiatorName: process.env.MPESA_INITIATOR_NAME!,
  initiatorPassword: process.env.MPESA_INITIATOR_PASSWORD!,
  securityCredential: process.env.MPESA_SECURITY_CREDENTIAL!,
  b2cShortcode: process.env.MPESA_B2C_SHORTCODE!,
}

interface MpesaWithdrawalRequest {
  phoneNumber: string
  amount: number
  userId: string
  remarks?: string
  occasion?: string
}

interface MpesaAuthResponse {
  access_token: string
  expires_in: string
}

interface MpesaB2CResponse {
  ConversationID: string
  OriginatorConversationID: string
  ResponseCode: string
  ResponseDescription: string
}

async function getMpesaAccessToken(): Promise<string> {
  const auth = Buffer.from(`${MPESA_CONFIG.consumerKey}:${MPESA_CONFIG.consumerSecret}`).toString('base64')

  const response = await fetch(
    MPESA_CONFIG.environment === 'sandbox'
      ? 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
      : 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
    {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    }
  )

  if (!response.ok) {
    throw new Error('Failed to get M-Pesa access token')
  }

  const data: MpesaAuthResponse = await response.json()
  return data.access_token
}

async function initiateB2CPayment(
  accessToken: string,
  phoneNumber: string,
  amount: number,
  remarks: string,
  occasion: string
): Promise<MpesaB2CResponse> {
  const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14)

  // Generate security credential (in production, this should be encrypted)
  const securityCredential = MPESA_CONFIG.securityCredential

  const b2cPayload = {
    InitiatorName: MPESA_CONFIG.initiatorName,
    SecurityCredential: securityCredential,
    CommandID: 'BusinessPayment', // or 'SalaryPayment', 'PromotionPayment'
    Amount: amount,
    PartyA: MPESA_CONFIG.b2cShortcode,
    PartyB: phoneNumber.replace(/^0/, '254'), // Convert to international format
    Remarks: remarks || 'Withdrawal from MINER platform',
    QueueTimeOutURL: `${process.env.NEXTAUTH_URL}/api/payments/mpesa-timeout`,
    ResultURL: `${process.env.NEXTAUTH_URL}/api/payments/mpesa-result`,
    Occasion: occasion || 'Withdrawal',
  }

  const response = await fetch(
    MPESA_CONFIG.environment === 'sandbox'
      ? 'https://sandbox.safaricom.co.ke/mpesa/b2c/v1/paymentrequest'
      : 'https://api.safaricom.co.ke/mpesa/b2c/v1/paymentrequest',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(b2cPayload),
    }
  )

  if (!response.ok) {
    const errorData = await response.text()
    throw new Error(`M-Pesa B2C payment failed: ${errorData}`)
  }

  return await response.json()
}

async function checkUserBalance(userId: string, amount: number): Promise<boolean> {
  // In production, check user's actual balance in your database
  // For now, we'll simulate this check
  console.log(`Checking balance for user ${userId}: ${amount} KES requested`)
  return true // Assume user has sufficient balance for demo
}

async function updateUserBalance(userId: string, amount: number): Promise<void> {
  // In production, deduct amount from user's balance in your database
  console.log(`Updating balance for user ${userId}: deducting ${amount} KES`)
}

async function saveWithdrawalRecord(
  userId: string,
  phoneNumber: string,
  amount: number,
  conversationID: string,
  originatorConversationID: string
) {
  const withdrawal = {
    userId,
    type: 'withdrawal',
    method: 'mpesa',
    phoneNumber,
    amount,
    amountKES: amount,
    amountUSD: amount / 130, // Approximate conversion rate
    status: 'processing',
    conversationID,
    originatorConversationID,
    createdAt: new Date(),
  }

  // In production, save to your database
  console.log('Withdrawal saved:', withdrawal)

  return withdrawal
}

export async function POST(request: NextRequest) {
  try {
    const body: MpesaWithdrawalRequest = await request.json()

    // Validate request
    if (!body.phoneNumber || !body.amount || !body.userId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate amount
    if (body.amount < 50) {
      return NextResponse.json(
        { success: false, error: 'Minimum withdrawal amount is 50 KES' },
        { status: 400 }
      )
    }

    // Validate maximum amount (prevent fraud)
    if (body.amount > 100000) {
      return NextResponse.json(
        { success: false, error: 'Maximum withdrawal amount is 100,000 KES' },
        { status: 400 }
      )
    }

    // Validate phone number (Kenyan format)
    const phoneRegex = /^(07|01)[0-9]{8}$/
    if (!phoneRegex.test(body.phoneNumber)) {
      return NextResponse.json(
        { success: false, error: 'Invalid phone number. Use Kenyan format (07xxxxxxxx or 01xxxxxxxx)' },
        { status: 400 }
      )
    }

    console.log(`Initiating M-Pesa withdrawal: ${body.amount} KES for user ${body.userId}`)

    // Check user balance
    const hasSufficientBalance = await checkUserBalance(body.userId, body.amount)
    if (!hasSufficientBalance) {
      return NextResponse.json(
        { success: false, error: 'Insufficient balance' },
        { status: 400 }
      )
    }

    // Get access token
    const accessToken = await getMpesaAccessToken()

    // Initiate B2C payment
    const b2cResponse = await initiateB2CPayment(
      accessToken,
      body.phoneNumber,
      body.amount,
      body.remarks || 'Withdrawal from MINER',
      body.occasion || 'Withdrawal'
    )

    // Check if B2C request was successful
    if (b2cResponse.ResponseCode !== '0') {
      return NextResponse.json(
        {
          success: false,
          error: 'B2C payment initiation failed',
          details: b2cResponse.ResponseDescription
        },
        { status: 400 }
      )
    }

    // Update user balance (deduct immediately, will be refunded if payment fails)
    await updateUserBalance(body.userId, body.amount)

    // Save withdrawal record
    const withdrawal = await saveWithdrawalRecord(
      body.userId,
      body.phoneNumber,
      body.amount,
      b2cResponse.ConversationID,
      b2cResponse.OriginatorConversationID
    )

    return NextResponse.json({
      success: true,
      message: 'Withdrawal request submitted successfully. You will receive the money shortly.',
      data: {
        conversationID: b2cResponse.ConversationID,
        originatorConversationID: b2cResponse.OriginatorConversationID,
        withdrawalId: withdrawal.id,
        amount: body.amount,
        phoneNumber: body.phoneNumber
      }
    })

  } catch (error) {
    console.error('M-Pesa withdrawal error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process M-Pesa withdrawal',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'User ID is required' },
      { status: 400 }
    )
  }

  try {
    // In production, fetch user's withdrawal history from database
    const withdrawalHistory = [
      {
        id: '1',
        amount: 1000,
        phoneNumber: '0712345678',
        status: 'completed',
        createdAt: '2024-01-15T10:30:00Z',
        processedAt: '2024-01-15T10:32:00Z'
      },
      {
        id: '2',
        amount: 2500,
        phoneNumber: '0712345678',
        status: 'processing',
        createdAt: '2024-01-16T14:20:00Z',
        processedAt: null
      }
    ]

    return NextResponse.json({
      success: true,
      data: {
        withdrawals: withdrawalHistory,
        totalAmount: withdrawalHistory.reduce((sum, w) => sum + w.amount, 0),
        processingCount: withdrawalHistory.filter(w => w.status === 'processing').length
      }
    })

  } catch (error) {
    console.error('Failed to fetch withdrawal history:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch withdrawal history',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}