"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowRight, Clock, Zap, TrendingUp, Search } from "lucide-react"

interface Task {
  id: string
  title: string
  category: string
  reward: number
  estimatedTime: string
  difficulty: "easy" | "medium" | "hard"
  completedCount?: number
  trustMultiplier: number
}

const TASK_CATEGORIES = [
  { id: "ad_based", label: "Watch & Earn", icon: "📺", color: "from-primary to-accent" },
  { id: "micro_jobs", label: "Work & Mine", icon: "💼", color: "from-accent to-secondary" },
  { id: "surveys", label: "Opinion Mining", icon: "📋", color: "from-secondary to-primary" },
  { id: "learning_quests", label: "Learn to Earn", icon: "📚", color: "from-primary to-secondary" },
  { id: "referral", label: "Invite & Mine", icon: "👥", color: "from-accent to-primary" },
  { id: "staking_validation", label: "Stake & Validate", icon: "🔒", color: "from-secondary to-accent" },
]

const SAMPLE_TASKS: Task[] = [
  {
    id: "1",
    title: "Watch TechCorp Advertisement",
    category: "ad_based",
    reward: 15,
    estimatedTime: "2 min",
    difficulty: "easy",
    completedCount: 234,
    trustMultiplier: 1.0,
  },
  {
    id: "2",
    title: "Label Product Images for AI",
    category: "micro_jobs",
    reward: 35,
    estimatedTime: "10 min",
    difficulty: "medium",
    completedCount: 156,
    trustMultiplier: 1.1,
  },
  {
    id: "3",
    title: "Market Research Survey",
    category: "surveys",
    reward: 45,
    estimatedTime: "15 min",
    difficulty: "medium",
    completedCount: 89,
    trustMultiplier: 1.05,
  },
  {
    id: "4",
    title: "Blockchain Basics Quiz",
    category: "learning_quests",
    reward: 20,
    estimatedTime: "8 min",
    difficulty: "easy",
    completedCount: 512,
    trustMultiplier: 1.15,
  },
  {
    id: "5",
    title: "Refer 3 Friends",
    category: "referral",
    reward: 75,
    estimatedTime: "1 min setup",
    difficulty: "easy",
    completedCount: 67,
    trustMultiplier: 1.2,
  },
  {
    id: "6",
    title: "Validate Task Submissions",
    category: "staking_validation",
    reward: 50,
    estimatedTime: "Ongoing",
    difficulty: "hard",
    completedCount: 43,
    trustMultiplier: 1.25,
  },
]

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case "easy":
      return "bg-green-500/20 text-green-400"
    case "medium":
      return "bg-yellow-500/20 text-yellow-400"
    case "hard":
      return "bg-red-500/20 text-red-400"
    default:
      return "bg-gray-500/20 text-gray-400"
  }
}

export default function TaskMarketplace() {
  const [selectedCategory, setSelectedCategory] = useState("ad_based")
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredTasks, setFilteredTasks] = useState<Task[]>(SAMPLE_TASKS)

  useEffect(() => {
    let tasks = SAMPLE_TASKS.filter((t) => t.category === selectedCategory)

    if (searchQuery) {
      tasks = tasks.filter((t) => t.title.toLowerCase().includes(searchQuery.toLowerCase()))
    }

    setFilteredTasks(tasks)
  }, [selectedCategory, searchQuery])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background">
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 pb-8 pt-12">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-80 w-80 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 h-80 w-80 bg-accent/10 rounded-full blur-3xl animate-pulse" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <h1 className="gradient-text mb-2 text-4xl font-bold">Task Marketplace</h1>
            <p className="text-muted-foreground">Complete tasks, earn MINER tokens, withdraw to real money</p>
          </div>

          <div className="mx-auto max-w-2xl">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-xl opacity-0 group-hover:opacity-100 blur transition duration-300" />
              <div className="relative flex items-center gap-2 rounded-xl bg-card border border-primary/20 px-4 py-3">
                <Search className="h-5 w-5 text-primary" />
                <Input
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border-0 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <Tabs defaultValue="ad_based" onValueChange={setSelectedCategory} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 bg-transparent mb-8">
            {TASK_CATEGORIES.map((cat) => (
              <TabsTrigger
                key={cat.id}
                value={cat.id}
                className="relative overflow-hidden group rounded-lg bg-card border border-primary/20 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-white transition-all duration-300"
              >
                <span className="mr-2">{cat.icon}</span>
                <span className="hidden sm:inline text-xs">{cat.label.split(" ")[0]}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {TASK_CATEGORIES.map((category) => (
            <TabsContent key={category.id} value={category.id} className="space-y-4">
              {filteredTasks.length === 0 ? (
                <Card className="border-primary/20 bg-card/50 backdrop-blur">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <div className="mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <Search className="h-8 w-8 text-primary/50" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-foreground">No tasks found</h3>
                    <p className="text-muted-foreground text-sm">Check back later for more {category.label} tasks</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredTasks.map((task, index) => (
                    <div key={task.id} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                      <Card className="group relative overflow-hidden border-primary/20 bg-gradient-to-br from-card to-card/50 hover:border-primary/50 transition-all duration-300 cursor-pointer h-full">
                        {/* Gradient overlay on hover */}
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-accent/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                        <CardHeader className="relative z-10">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors">
                                {task.title}
                              </CardTitle>
                              <CardDescription className="mt-1">{category.label}</CardDescription>
                            </div>
                            <div className="text-2xl">{category.icon}</div>
                          </div>
                        </CardHeader>

                        <CardContent className="relative z-10 space-y-4">
                          {/* Reward display with glow effect */}
                          <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 group-hover:from-primary/20 group-hover:to-accent/20 transition-all">
                            <div className="flex items-center gap-2">
                              <Zap className="h-5 w-5 text-primary" />
                              <span className="text-sm font-medium text-muted-foreground">Reward</span>
                            </div>
                            <span className="text-xl font-bold text-primary">+{task.reward} MINER</span>
                          </div>

                          {/* Task metadata */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="h-4 w-4 text-accent" />
                              <span className="text-muted-foreground">{task.estimatedTime}</span>
                            </div>
                            <Badge className={getDifficultyColor(task.difficulty)}>
                              {task.difficulty.charAt(0).toUpperCase() + task.difficulty.slice(1)}
                            </Badge>
                          </div>

                          {/* Stats */}
                          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-primary/10">
                            <span>{task.completedCount?.toLocaleString()} completed</span>
                            <div className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3 text-primary" />
                              <span>{(task.trustMultiplier * 100).toFixed(0)}%</span>
                            </div>
                          </div>

                          {/* CTA Button */}
                          <Link href={`/marketplace/${task.id}`} className="block">
                            <Button className="w-full bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/40 text-white font-semibold py-2 rounded-lg transition-all duration-300 group-hover:translate-y-0.5">
                              Start Task
                              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </Button>
                          </Link>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-primary/10 bg-gradient-to-r from-card via-background to-card backdrop-blur-lg">
        <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between text-sm">
          <div className="flex gap-6">
            <div>
              <span className="text-muted-foreground">Total Available</span>
              <p className="font-semibold text-primary text-lg">
                {filteredTasks.reduce((sum, t) => sum + t.reward, 0)} MINER
              </p>
            </div>
            <div className="hidden sm:block">
              <span className="text-muted-foreground">Average Reward</span>
              <p className="font-semibold text-accent text-lg">
                {filteredTasks.length > 0
                  ? (filteredTasks.reduce((sum, t) => sum + t.reward, 0) / filteredTasks.length).toFixed(0)
                  : 0}{" "}
                MINER
              </p>
            </div>
          </div>
          <Button asChild variant="outline" className="border-primary/30 hover:bg-primary/10 bg-transparent">
            <Link href="/dashboard">View Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
