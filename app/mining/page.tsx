"use client"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { ArrowUp, Zap, TrendingUp, Clock } from "lucide-react"
import { MiningTaskCard } from "@/components/mining-task-card"
import { RewardChart } from "@/components/reward-chart"

interface MiningStats {
  mining: {
    totalSubmissions: number
    approvedCount: number
    pendingCount: number
    earnedToday: number
    pendingOnchain: number
  }
  balance: {
    available: number
    pending: number
  }
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const MINING_TASKS = [
  {
    id: "1",
    name: "Data Tagging",
    type: "micro_task",
    reward: 5,
    duration: "5 min",
    difficulty: "easy",
    description: "Label images for AI training",
  },
  {
    id: "2",
    name: "Quiz Challenge",
    type: "quiz",
    reward: 6,
    duration: "10 min",
    difficulty: "medium",
    description: "Answer trivia questions",
  },
  {
    id: "3",
    name: "Sponsored Engagement",
    type: "sponsored",
    reward: 10,
    duration: "15 min",
    difficulty: "medium",
    description: "Engage with partner content",
  },
  {
    id: "4",
    name: "Referral Bonus",
    type: "referral",
    reward: 2,
    duration: "Ongoing",
    difficulty: "easy",
    description: "Earn from referred users",
  },
]

export default function MiningPage() {
  const router = useRouter()
  const {
    data: stats,
    isLoading,
    mutate,
  } = useSWR<MiningStats>("/api/mining/status", fetcher, {
    refreshInterval: 30000,
  })

  const totalBalance = (stats?.balance.available || 0) + (stats?.balance.pending || 0)
  const dailyLimit = 500000
  const dailyProgress = ((stats?.mining.earnedToday || 0) / dailyLimit) * 100

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">Mining Dashboard</h1>
          <p className="text-muted-foreground">Earn MINER tokens through legitimate tasks</p>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="card-hover">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Available Balance</p>
                  <p className="text-2xl font-bold">{stats?.balance.available.toFixed(2) || 0}</p>
                </div>
                <div className="bg-primary/20 p-3 rounded-lg">
                  <ArrowUp className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Rewards</p>
                  <p className="text-2xl font-bold">{stats?.balance.pending.toFixed(2) || 0}</p>
                </div>
                <div className="bg-accent/20 p-3 rounded-lg">
                  <Clock className="h-6 w-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Earned Today</p>
                  <p className="text-2xl font-bold">{stats?.mining.earnedToday.toFixed(2) || 0}</p>
                </div>
                <div className="bg-success/20 p-3 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tasks Completed</p>
                  <p className="text-2xl font-bold">{stats?.mining.approvedCount || 0}</p>
                </div>
                <div className="bg-warning/20 p-3 rounded-lg">
                  <Zap className="h-6 w-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Daily Progress */}
        <Card className="card-hover mb-8">
          <CardHeader>
            <CardTitle>Daily Emission Progress</CardTitle>
            <CardDescription>MINER tokens distributed today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{stats?.mining.earnedToday.toFixed(2) || 0} / 500,000 MINER</span>
                <span className="text-muted-foreground">{dailyProgress.toFixed(1)}%</span>
              </div>
              <Progress value={Math.min(dailyProgress, 100)} className="h-3" />
            </div>
          </CardContent>
        </Card>

        {/* Mining Tasks */}
        <Tabs defaultValue="available" className="mb-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="available">Available Tasks</TabsTrigger>
            <TabsTrigger value="history">Submission History</TabsTrigger>
            <TabsTrigger value="rewards">Reward History</TabsTrigger>
          </TabsList>

          <TabsContent value="available" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {MINING_TASKS.map((task) => (
                <MiningTaskCard key={task.id} task={task} onStart={() => router.push(`/mining/${task.id}`)} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Submissions</CardTitle>
                <CardDescription>{stats?.mining.totalSubmissions || 0} total submissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center text-muted-foreground py-8">Loading submission history...</div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rewards">
            <RewardChart />
          </TabsContent>
        </Tabs>

        {/* Staking Multiplier Info */}
        <Card className="card-hover bg-gradient-to-r from-primary/10 to-accent/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-accent" />
              Boost Your Earnings with Staking
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">
              Stake your MINER tokens to earn staking rewards AND boost your mining multiplier up to 1.5x.
            </p>
            <Button onClick={() => router.push("/staking")} className="btn-primary">
              Start Staking Now
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
