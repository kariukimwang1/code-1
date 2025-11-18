import { type NextRequest, NextResponse } from "next/server"
import { getTaskById } from "@/lib/tasks"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const task = await getTaskById(params.id)
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }
    return NextResponse.json({ task })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to fetch task" }, { status: 500 })
  }
}
