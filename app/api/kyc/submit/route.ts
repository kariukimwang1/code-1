import { NextRequest, NextResponse } from "next/server"
import { getAuth } from "@/lib/auth"
import { query } from "@/lib/database"

interface KYCSubmission {
  level: number
  fullName: string
  dateOfBirth: string
  address: {
    street: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  phoneNumber?: string
  idDocumentType: string
  idDocumentFront: string // Base64 encoded
  idDocumentBack?: string // Base64 encoded
  proofOfAddress?: string // Base64 encoded
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuth(req)
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const kycData: KYCSubmission = await req.json()

    // Validate KYC data
    if (!kycData.fullName || !kycData.dateOfBirth || !kycData.address) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Check if user already has a pending KYC submission
    const existingSubmission = await query(
      "SELECT id, status FROM kyc_submissions WHERE user_id = $1 AND status = 'pending'",
      [user.userId]
    )

    if (existingSubmission.rows.length > 0) {
      return NextResponse.json(
        { error: "You already have a pending KYC submission" },
        { status: 400 }
      )
    }

    // Get current KYC level
    const userResult = await query(
      "SELECT kyc_level FROM users WHERE id = $1",
      [user.userId]
    )

    const currentLevel = userResult.rows[0]?.kyc_level || 0

    // Validate submission level progression
    if (kycData.level <= currentLevel) {
      return NextResponse.json(
        { error: "Invalid KYC level submission" },
        { status: 400 }
      )
    }

    // Validate requirements for each level
    const validationError = validateKYCLevel(kycData.level, kycData)
    if (validationError) {
      return NextResponse.json(
        { error: validationError },
        { status: 400 }
      )
    }

    // Store KYC submission
    const submissionResult = await query(
      `INSERT INTO kyc_submissions
       (user_id, level, full_name, date_of_birth, phone_number, address, id_document_type,
        id_document_front, id_document_back, proof_of_address, status, submitted_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending', NOW())
       RETURNING id`,
      [
        user.userId,
        kycData.level,
        kycData.fullName,
        kycData.dateOfBirth,
        kycData.phoneNumber,
        JSON.stringify(kycData.address),
        kycData.idDocumentType,
        kycData.idDocumentFront,
        kycData.idDocumentBack || null,
        kycData.proofOfAddress || null
      ]
    )

    const submissionId = submissionResult.rows[0].id

    // In production, integrate with external KYC service
    // For now, we'll simulate the verification process
    await processKYCSubmission(submissionId, kycData.level)

    return NextResponse.json({
      success: true,
      message: `KYC Level ${kycData.level} submission received successfully`,
      submissionId
    })

  } catch (error) {
    console.error("Error submitting KYC:", error)
    return NextResponse.json(
      { error: "Failed to submit KYC application" },
      { status: 500 }
    )
  }
}

function validateKYCLevel(level: number, data: KYCSubmission): string | null {
  switch (level) {
    case 1:
      // Level 1: Basic verification (phone + address)
      if (!data.phoneNumber) {
        return "Phone number is required for Level 1 KYC"
      }
      if (!data.proofOfAddress) {
        return "Proof of address is required for Level 1 KYC"
      }
      break

    case 2:
      // Level 2: Enhanced verification (government ID)
      if (!data.idDocumentFront) {
        return "ID document front is required for Level 2 KYC"
      }
      if (!['PASSPORT', 'DRIVING_LICENSE', 'NATIONAL_ID'].includes(data.idDocumentType)) {
        return "Invalid ID document type for Level 2 KYC"
      }
      break

    default:
      return "Invalid KYC level"
  }

  return null
}

async function processKYCSubmission(submissionId: string, level: number) {
  try {
    // In production, integrate with external KYC services like:
    // - Veriff
    // - Onfido
    // - Jumio
    // - Sumsub

    // For demonstration, we'll simulate the process
    console.log(`Processing KYC submission ${submissionId} for Level ${level}`)

    // Simulate processing time
    setTimeout(async () => {
      // Simulate 70% approval rate
      const isApproved = Math.random() > 0.3

      if (isApproved) {
        // Get submission details
        const submissionResult = await query(
          "SELECT user_id FROM kyc_submissions WHERE id = $1",
          [submissionId]
        )

        if (submissionResult.rows.length > 0) {
          const userId = submissionResult.rows[0].user_id

          // Update user KYC level
          await query(
            "UPDATE users SET kyc_level = $1, updated_at = NOW() WHERE id = $2",
            [level, userId]
          )

          // Update submission status
          await query(
            "UPDATE kyc_submissions SET status = 'approved', processed_at = NOW() WHERE id = $1",
            [submissionId]
          )

          console.log(`KYC Level ${level} approved for user ${userId}`)
        }
      } else {
        // Reject submission
        await query(
          "UPDATE kyc_submissions SET status = 'rejected', processed_at = NOW() WHERE id = $1",
          [submissionId]
        )

        console.log(`KYC Level ${level} rejected for submission ${submissionId}`)
      }
    }, 5000) // 5 second delay

  } catch (error) {
    console.error("Error processing KYC submission:", error)
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAuth(req)
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get user's KYC status
    const userResult = await query(
      `SELECT kyc_level, email_verified FROM users WHERE id = $1`,
      [user.userId]
    )

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    const userData = userResult.rows[0]

    // Get latest KYC submission
    const submissionResult = await query(
      `SELECT id, level, status, submitted_at, processed_at FROM kyc_submissions
       WHERE user_id = $1
       ORDER BY submitted_at DESC LIMIT 1`,
      [user.userId]
    )

    const submission = submissionResult.rows[0] || null

    return NextResponse.json({
      currentLevel: userData.kyc_level,
      emailVerified: userData.email_verified,
      latestSubmission: submission ? {
        id: submission.id,
        level: submission.level,
        status: submission.status,
        submittedAt: submission.submitted_at,
        processedAt: submission.processed_at
      } : null
    })

  } catch (error) {
    console.error("Error getting KYC status:", error)
    return NextResponse.json(
      { error: "Failed to get KYC status" },
      { status: 500 }
    )
  }
}