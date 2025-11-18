"use client"

import { useEffect, useState } from "react"
import { Loader2, Search, Clock, Award, Zap } from "lucide-react"
import Link from "next/link"

interface Task {
  id: string
  title: string
  description: string
  reward_tokens: number
  complexity_score: number
  type: string
  max_claims: number
  claims_count: number
  created_at: string
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [search, setSearch] = useState("")

  useEffect(() => {
    async function fetchTasks() {
      try {
        const res = await fetch(`/api/tasks?filter=${filter}&search=${search}`)
        if (!res.ok) throw new Error("Failed to fetch tasks")
        const data = await res.json()
        setTasks(data.tasks)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    fetchTasks()
  }, [filter, search])

  const difficultyBadgeColor = (score: number) => {
    if (score <= 2) return "bg-success/20 text-success"
    if (score <= 4) return "bg-warning/20 text-warning"
    return "bg-error/20 text-error"
  }

  const difficultyLabel = (score: number) => {
    if (score <= 2) return "Easy"
    if (score <= 4) return "Medium"
    return "Hard"
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="font-bold text-xl">
            MINER
          </Link>
          <div className="flex gap-4">
            <Link href="/dashboard" className="hover:text-primary">
              Dashboard
            </Link>
            <Link href="/tasks" className="text-primary font-semibold">
              Tasks
            </Link>
            <Link href="/staking" className="hover:text-primary">
              Staking
            </Link>
            <Link href="/withdraw" className="hover:text-primary">
              Withdraw
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2">Task Marketplace</h1>
          <p className="text-lg text-foreground/60">Browse and complete tasks to earn MINER tokens</p>
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Search Tasks</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-foreground/40" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by title or description..."
                  className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Filter by Type</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:outline-none focus:border-primary"
              >
                <option value="all">All Tasks</option>
                <option value="micro-tasks">Micro Tasks</option>
                <option value="quizzes">Quizzes</option>
                <option value="sponsored">Sponsored</option>
                <option value="compute">Compute Jobs</option>
              </select>
            </div>
          </div>
        </div>

        {/* Task Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-foreground/60 text-lg">No tasks available right now. Check back soon!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tasks.map((task) => (
              <Link
                key={task.id}
                href={`/tasks/${task.id}`}
                className="bg-card border border-border rounded-lg p-6 hover:border-primary hover:shadow-lg hover:shadow-primary/20 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-bold flex-1">{task.title}</h3>
                  <span
                    className={`px-3 py-1 rounded-lg text-sm font-medium whitespace-nowrap ml-2 ${difficultyBadgeColor(task.complexity_score)}`}
                  >
                    {difficultyLabel(task.complexity_score)}
                  </span>
                </div>

                <p className="text-foreground/60 text-sm mb-4 line-clamp-2">{task.description}</p>

                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-primary" />
                    <span className="font-semibold">{task.reward_tokens.toLocaleString()} MINER</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-accent" />
                    <span className="text-sm">~15 min</span>
                  </div>
                </div>

                <div className="text-sm text-foreground/60 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  <span>
                    {task.claims_count}/{task.max_claims === -1 ? "∞" : task.max_claims} completed
                  </span>
                </div>

                <button className="w-full mt-6 bg-primary hover:bg-primary-dark text-black font-bold py-2 px-4 rounded-lg transition-colors">
                  Start Task
                </button>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
