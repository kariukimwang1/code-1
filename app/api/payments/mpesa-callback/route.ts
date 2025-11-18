import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

interface MpesaCallbackData {
  Body: {
    stkCallback: {
      MerchantRequestID: string
      CheckoutRequestID: string
      ResultCode: number
      ResultDesc: string
      CallbackMetadata?: {
        Item: Array<{
          Name: string
          Value?: string | number
        }>
      }
    }
  }
}

async function verifyCallbackSignature(body: string, signature: string): Promise<boolean> {
  // In production, verify the callback signature using M-Pesa's public key
  // For now, we'll skip signature verification for simplicity
  return true
}

async function updateTransactionStatus(
  checkoutRequestID: string,
  resultCode: number,
  resultDesc: string,
  metadata?: any
): Promise<void> {
  // Find transaction by checkoutRequestID
  console.log(`Updating transaction ${checkoutRequestID}: ${resultCode} - ${resultDesc}`)

  if (resultCode === 0) {
    // Successful payment
    let amount = 0
    let phoneNumber = ''
    let mpesaReceipt = ''

    if (metadata && metadata.Item) {
      metadata.Item.forEach((item: any) => {
        switch (item.Name) {
          case 'Amount':
            amount = parseInt(item.Value?.toString() || '0')
            break
          case 'PhoneNumber':
            phoneNumber = item.Value?.toString() || ''
            break
          case 'MpesaReceiptNumber':
            mpesaReceipt = item.Value?.toString() || ''
            break
        }
      })
    }

    console.log(`Payment successful: ${amount} KES from ${phoneNumber}, Receipt: ${mpesaReceipt}`)

    // Update user balance in production
    // await updateUserBalance(userId, amount)

    // Send notification to user
    // await sendPaymentSuccessNotification(userId, amount, mpesaReceipt)

  } else {
    // Failed payment
    console.log(`Payment failed: ${resultDesc}`)

    // Send notification to user about failed payment
    // await sendPaymentFailedNotification(userId, resultDesc)
  }
}

async function logCallbackData(data: MpesaCallbackData) {
  console.log('M-Pesa callback received:', JSON.stringify(data, null, 2))

  // In production, store callback data for audit purposes
  // await saveCallbackData(data)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('X-Validation-Signature') || ''

    console.log('M-Pesa callback received')

    // Verify signature (in production)
    // const isValidSignature = await verifyCallbackSignature(body, signature)
    // if (!isValidSignature) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    // }

    let data: MpesaCallbackData
    try {
      data = JSON.parse(body)
    } catch (parseError) {
      console.error('Failed to parse callback JSON:', parseError)
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    // Log callback data for debugging
    await logCallbackData(data)

    const { stkCallback } = data.Body

    // Update transaction status
    await updateTransactionStatus(
      stkCallback.CheckoutRequestID,
      stkCallback.ResultCode,
      stkCallback.ResultDesc,
      stkCallback.CallbackMetadata
    )

    // Return success response to M-Pesa
    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: 'Callback received successfully'
    })

  } catch (error) {
    console.error('M-Pesa callback processing error:', error)

    // Still return success to avoid M-Pesa retrying
    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: 'Callback processed'
    })
  }
}