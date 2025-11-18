import { type NextRequest, NextResponse } from "next/server"
import { verifyJWT } from "@/lib/auth"
import { submitTaskEvidence } from "@/lib/tasks"
import crypto from "crypto"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1]
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = verifyJWT(token)
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { evidence } = await request.json()
    if (!evidence) {
      return NextResponse.json({ error: "Evidence required" }, { status: 400 })
    }

    // Hash evidence for duplicate detection
    const evidenceHash = crypto.createHash("sha256").update(evidence).digest("hex")

    const submission = await submitTaskEvidence(params.id, payload.userId, evidence, evidenceHash)

    return NextResponse.json({ submission }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Submission failed" }, { status: 500 })
  }
}
