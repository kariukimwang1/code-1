"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Clock, Award, CheckCircle2, Upload, Loader2 } from "lucide-react"

interface Task {
  id: string
  title: string
  description: string
  reward_tokens: number
  complexity_score: number
  type: string
}

export default function TaskDetailPage() {
  const params = useParams()
  const taskId = params.id as string
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [evidence, setEvidence] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    async function fetchTask() {
      try {
        const res = await fetch(`/api/tasks/${taskId}`)
        if (!res.ok) throw new Error("Failed to fetch task")
        const data = await res.json()
        setTask(data.task)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load task")
      } finally {
        setLoading(false)
      }
    }

    fetchTask()
  }, [taskId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSubmitting(true)

    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`/api/tasks/${taskId}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ evidence }),
      })

      if (!res.ok) throw new Error("Submission failed")
      setSubmitted(true)
      setTimeout(() => (window.location.href = "/dashboard"), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-foreground/60">Task not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/tasks" className="hover:text-primary flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" />
            Back to Tasks
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-card border border-border rounded-lg p-8">
          <h1 className="text-4xl font-bold mb-4">{task.title}</h1>
          <p className="text-lg text-foreground/60 mb-8">{task.description}</p>

          {/* Task Details */}
          <div className="grid md:grid-cols-3 gap-6 mb-12 p-6 bg-background rounded-lg">
            <div>
              <div className="text-foreground/60 text-sm mb-2">Reward</div>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                <span className="text-2xl font-bold">{task.reward_tokens.toLocaleString()}</span>
                <span className="text-foreground/60">MINER</span>
              </div>
            </div>

            <div>
              <div className="text-foreground/60 text-sm mb-2">Time Estimate</div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-accent" />
                <span className="text-2xl font-bold">~15</span>
                <span className="text-foreground/60">minutes</span>
              </div>
            </div>

            <div>
              <div className="text-foreground/60 text-sm mb-2">Difficulty</div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">
                  {task.complexity_score <= 2 ? "Easy" : task.complexity_score <= 4 ? "Medium" : "Hard"}
                </span>
              </div>
            </div>
          </div>

          {/* Task Instructions */}
          <div className="mb-12 p-6 bg-background rounded-lg border border-border">
            <h2 className="text-xl font-bold mb-4">How to Complete This Task</h2>
            <ol className="space-y-3 text-foreground/80">
              <li className="flex gap-3">
                <span className="font-bold text-primary">1.</span>
                <span>Read the task requirements carefully</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-primary">2.</span>
                <span>Complete the required action (screenshot, link, etc.)</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-primary">3.</span>
                <span>Submit your evidence below</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-primary">4.</span>
                <span>Wait for admin verification (usually within 24 hours)</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-primary">5.</span>
                <span>Receive your MINER tokens upon approval</span>
              </li>
            </ol>
          </div>

          {/* Submission Form */}
          {submitted ? (
            <div className="bg-success/20 border border-success rounded-lg p-6 text-center">
              <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Submission Received!</h3>
              <p className="text-foreground/60 mb-4">
                Your evidence has been submitted for review. You'll receive your reward within 24 hours.
              </p>
              <p className="text-sm text-foreground/40">Redirecting to dashboard...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Submit Evidence</label>
                <p className="text-sm text-foreground/60 mb-4">
                  Provide proof of task completion (screenshot URL, form submission link, etc.)
                </p>
                <div className="relative">
                  <Upload className="absolute left-3 top-3 w-5 h-5 text-foreground/40" />
                  <textarea
                    value={evidence}
                    onChange={(e) => setEvidence(e.target.value)}
                    placeholder="Paste your evidence link or description here..."
                    className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-primary min-h-24"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="bg-error/20 border border-error rounded-lg p-4 text-error text-sm">{error}</div>
              )}

              <button
                type="submit"
                disabled={submitting || !evidence}
                className="w-full bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting ? "Submitting..." : "Submit Evidence"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
