import { type NextRequest, NextResponse } from "next/server"
import { getActiveTasks } from "@/lib/tasks"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    const tasks = await getActiveTasks(limit, offset)
    return NextResponse.json({ tasks })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 })
  }
}
