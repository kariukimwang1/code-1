import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const MPESA_CONFIG = {
  consumerKey: process.env.MPESA_CONSUMER_KEY!,
  consumerSecret: process.env.MPESA_CONSUMER_SECRET!,
  shortcode: process.env.MPESA_SHORTCODE!,
  passkey: process.env.MPESA_PASSKEY!,
  environment: process.env.MPESA_ENVIRONMENT || 'sandbox',
  callbackUrl: process.env.MPESA_CALLBACK_URL!,
}

interface MpesaDepositRequest {
  phoneNumber: string
  amount: number
  userId: string
  accountReference: string
}

interface MpesaAuthResponse {
  access_token: string
  expires_in: string
}

interface MpesaStkPushResponse {
  MerchantRequestID: string
  CheckoutRequestID: string
  ResponseCode: string
  ResponseDescription: string
  CustomerMessage: string
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

async function initiateStkPush(
  accessToken: string,
  phoneNumber: string,
  amount: number,
  accountReference: string
): Promise<MpesaStkPushResponse> {
  const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14)
  const password = crypto
    .createHash('sha256')
    .update(`${MPESA_CONFIG.shortcode}${MPESA_CONFIG.passkey}${timestamp}`)
    .digest('base64')

  const stkPayload = {
    BusinessShortCode: MPESA_CONFIG.shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: amount,
    PartyA: phoneNumber.replace(/^0/, '254'), // Convert to international format
    PartyB: MPESA_CONFIG.shortcode,
    PhoneNumber: phoneNumber.replace(/^0/, '254'),
    CallBackURL: MPESA_CONFIG.callbackUrl,
    AccountReference: accountReference,
    TransactionDesc: `Deposit of ${amount} KES`,
  }

  const response = await fetch(
    MPESA_CONFIG.environment === 'sandbox'
      ? 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
      : 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(stkPayload),
    }
  )

  if (!response.ok) {
    const errorData = await response.text()
    throw new Error(`M-Pesa STK Push failed: ${errorData}`)
  }

  return await response.json()
}

async function saveTransactionRecord(
  userId: string,
  phoneNumber: string,
  amount: number,
  checkoutRequestID: string,
  merchantRequestID: string
) {
  // Save to database
  const transaction = {
    userId,
    type: 'deposit',
    method: 'mpesa',
    phoneNumber,
    amount,
    amountKES: amount,
    amountUSD: amount / 130, // Approximate conversion rate
    status: 'pending',
    checkoutRequestID,
    merchantRequestID,
    createdAt: new Date(),
  }

  // In production, save to your database
  console.log('Transaction saved:', transaction)

  return transaction
}

export async function POST(request: NextRequest) {
  try {
    const body: MpesaDepositRequest = await request.json()

    // Validate request
    if (!body.phoneNumber || !body.amount || !body.userId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate amount
    if (body.amount < 10) {
      return NextResponse.json(
        { success: false, error: 'Minimum deposit amount is 10 KES' },
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

    console.log(`Initiating M-Pesa deposit: ${body.amount} KES for user ${body.userId}`)

    // Get access token
    const accessToken = await getMpesaAccessToken()

    // Generate account reference
    const accountReference = body.accountReference || `MINER-${body.userId.slice(-8)}`

    // Initiate STK push
    const stkResponse = await initiateStkPush(
      accessToken,
      body.phoneNumber,
      body.amount,
      accountReference
    )

    // Check if STK push was successful
    if (stkResponse.ResponseCode !== '0') {
      return NextResponse.json(
        {
          success: false,
          error: 'STK push failed',
          details: stkResponse.ResponseDescription
        },
        { status: 400 }
      )
    }

    // Save transaction record
    const transaction = await saveTransactionRecord(
      body.userId,
      body.phoneNumber,
      body.amount,
      stkResponse.CheckoutRequestID,
      stkResponse.MerchantRequestID
    )

    return NextResponse.json({
      success: true,
      message: 'STK push sent successfully. Please check your phone to complete the transaction.',
      data: {
        checkoutRequestID: stkResponse.CheckoutRequestID,
        merchantRequestID: stkResponse.MerchantRequestID,
        customerMessage: stkResponse.CustomerMessage,
        transactionId: transaction.id
      }
    })

  } catch (error) {
    console.error('M-Pesa deposit error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process M-Pesa deposit',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}