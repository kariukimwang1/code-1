"use client"

import type React from "react"

import { useEffect, useState } from "react"
import Link from "next/link"
import { TrendingUp, TrendingDown, Calendar, DollarSign, Award, Target, Activity, BarChart3, PieChart, Clock, Zap } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

interface AnalyticsData {
  earnings: {
    today: number
    thisWeek: number
    thisMonth: number
    thisYear: number
    allTime: number
    dailyAverage: number
    monthlyGrowth: number
  }
  mining: {
    tasksCompleted: number
    averageRewardPerTask: number
    successRate: number
    activeTime: number
    efficiency: number
  }
  staking: {
    totalStaked: number
    totalRewards: number
    averageAPY: number
    currentPositions: number
    totalProfit: number
  }
  referrals: {
    totalReferrals: number
    activeReferrals: number
    totalBonusEarned: number
    conversionRate: number
  }
  performance: {
    currentLevel: number
    experiencePoints: number
    nextLevelXP: number
    achievements: string[]
    rank: number
    percentile: number
  }
}

interface DailyActivity {
  date: string
  earnings: number
  tasksCompleted: number
  activeMinutes: number
  stakingRewards: number
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [dailyActivity, setDailyActivity] = useState<DailyActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState("30")

  useEffect(() => {
    async function fetchAnalyticsData() {
      try {
        const token = localStorage.getItem("token")
        if (!token) {
          window.location.href = "/login"
          return
        }

        // Mock analytics data - replace with API call
        setAnalytics({
          earnings: {
            today: 47.25,
            thisWeek: 287.50,
            thisMonth: 1247.85,
            thisYear: 8945.20,
            allTime: 2347.85,
            dailyAverage: 42.15,
            monthlyGrowth: 12.5
          },
          mining: {
            tasksCompleted: 1847,
            averageRewardPerTask: 8.75,
            successRate: 94.2,
            activeTime: 2847, // minutes
            efficiency: 87.3
          },
          staking: {
            totalStaked: 10000,
            totalRewards: 425.75,
            averageAPY: 18.5,
            currentPositions: 3,
            totalProfit: 425.75
          },
          referrals: {
            totalReferrals: 24,
            activeReferrals: 18,
            totalBonusEarned: 240.00,
            conversionRate: 75.0
          },
          performance: {
            currentLevel: 15,
            experiencePoints: 2847,
            nextLevelXP: 3000,
            achievements: ["Early Adopter", "Power Miner", "Staking Pro", "Top Referrer", "Consistency Champion", "Task Master"],
            rank: 247,
            percentile: 85.2
          }
        })

        // Generate mock daily activity data
        const generateDailyData = () => {
          const data: DailyActivity[] = []
          const today = new Date()
          for (let i = 29; i >= 0; i--) {
            const date = new Date(today)
            date.setDate(date.getDate() - i)
            data.push({
              date: date.toISOString().split('T')[0],
              earnings: Math.random() * 50 + 20,
              tasksCompleted: Math.floor(Math.random() * 8) + 2,
              activeMinutes: Math.floor(Math.random() * 120) + 30,
              stakingRewards: Math.random() * 10 + 2
            })
          }
          return data
        }

        setDailyActivity(generateDailyData())

      } catch (err) {
        console.error("Failed to fetch analytics:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalyticsData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Analytics Not Available</h3>
          <p className="text-muted-foreground">Unable to load analytics data.</p>
        </div>
      </div>
    )
  }

  const experienceProgress = (analytics.performance.experiencePoints / analytics.performance.nextLevelXP) * 100

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="font-bold text-xl">
            MINER
          </Link>
          <div className="flex gap-4">
            <Link href="/dashboard" className="hover:text-primary">
              Dashboard
            </Link>
            <Link href="/history" className="hover:text-primary">
              History
            </Link>
            <Link href="/analytics" className="text-primary font-semibold">
              Analytics
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Track your performance and earnings trends</p>
        </div>

        {/* Key Metrics Overview */}
        <div className="grid md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Today's Earnings</p>
                  <p className="text-2xl font-bold">{analytics.earnings.today.toFixed(2)} MINER</p>
                  <div className="flex items-center gap-1 text-sm text-success mt-1">
                    <TrendingUp className="w-3 h-3" />
                    +12.5%
                  </div>
                </div>
                <DollarSign className="w-8 h-8 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">This Month</p>
                  <p className="text-2xl font-bold">{analytics.earnings.thisMonth.toFixed(0)} MINER</p>
                  <div className="flex items-center gap-1 text-sm text-success mt-1">
                    <TrendingUp className="w-3 h-3" />
                    +{analytics.earnings.monthlyGrowth}%
                  </div>
                </div>
                <Calendar className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Daily Average</p>
                  <p className="text-2xl font-bold">{analytics.earnings.dailyAverage.toFixed(1)} MINER</p>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                    <Activity className="w-3 h-3" />
                    Consistent
                  </div>
                </div>
                <BarChart3 className="w-8 h-8 text-accent" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Staked</p>
                  <p className="text-2xl font-bold">{analytics.staking.totalStaked.toLocaleString()}</p>
                  <div className="flex items-center gap-1 text-sm text-primary mt-1">
                    <TrendingUp className="w-3 h-3" />
                    {analytics.staking.averageAPY}% APY
                  </div>
                </div>
                <Award className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Current Level</p>
                  <p className="text-2xl font-bold">{analytics.performance.currentLevel}</p>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                    <Target className="w-3 h-3" />
                    Top {analytics.performance.percentile.toFixed(1)}%
                  </div>
                </div>
                <Zap className="w-8 h-8 text-warning" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="mining">Mining</TabsTrigger>
            <TabsTrigger value="staking">Staking</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Earnings Trend */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Earnings Trend (30 Days)
                  </CardTitle>
                  <CardDescription>Your daily earnings over the last month</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Average: {analytics.earnings.dailyAverage.toFixed(1)} MINER/day</span>
                      <span>Total: {analytics.earnings.thisMonth.toFixed(0)} MINER</span>
                    </div>
                    <div className="h-40 flex items-end justify-between gap-1">
                      {dailyActivity.slice(-14).map((day, idx) => (
                        <div
                          key={idx}
                          className="bg-primary rounded-t flex-1 flex flex-col items-center"
                          style={{ height: `${(day.earnings / 80) * 100}%` }}
                          title={`${day.date}: ${day.earnings.toFixed(1)} MINER`}
                        >
                          <span className="text-xs text-primary-foreground mt-1">
                            {day.earnings > 0 ? day.earnings.toFixed(0) : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>14 days ago</span>
                      <span>Today</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Activity Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5" />
                    Activity Breakdown
                  </CardTitle>
                  <CardDescription>How you earned tokens this month</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-success rounded-full"></div>
                          Mining Rewards
                        </span>
                        <span className="font-medium">65%</span>
                      </div>
                      <Progress value={65} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-primary rounded-full"></div>
                          Staking Rewards
                        </span>
                        <span className="font-medium">25%</span>
                      </div>
                      <Progress value={25} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-accent rounded-full"></div>
                          Referral Bonuses
                        </span>
                        <span className="font-medium">10%</span>
                      </div>
                      <Progress value={10} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats */}
            <div className="grid md:grid-cols-4 gap-4 mt-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-success">
                      ${analytics.earnings.allTime.toFixed(0)}
                    </div>
                    <div className="text-sm text-muted-foreground">All-Time Earnings</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {analytics.mining.tasksCompleted}
                    </div>
                    <div className="text-sm text-muted-foreground">Tasks Completed</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-accent">
                      {analytics.mining.successRate}%
                    </div>
                    <div className="text-sm text-muted-foreground">Success Rate</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-warning">
                      {Math.floor(analytics.mining.activeTime / 60)}h
                    </div>
                    <div className="text-sm text-muted-foreground">Active Time</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Mining Tab */}
          <TabsContent value="mining">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Mining Performance
                  </CardTitle>
                  <CardDescription>Your mining activity and efficiency metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Tasks Completed</div>
                      <div className="text-2xl font-bold">{analytics.mining.tasksCompleted.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Success Rate</div>
                      <div className="text-2xl font-bold">{analytics.mining.successRate}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Avg. Reward/Task</div>
                      <div className="text-2xl font-bold">{analytics.mining.averageRewardPerTask} MINER</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Efficiency</div>
                      <div className="text-2xl font-bold">{analytics.mining.efficiency}%</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">Mining Efficiency</div>
                    <Progress value={analytics.mining.efficiency} className="h-2" />
                    <div className="text-xs text-muted-foreground mt-1">
                      Above average performance
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Mining History</CardTitle>
                  <CardDescription>Daily mining activity trends</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Tasks per day (avg)</span>
                        <span className="font-medium">
                          {(analytics.mining.tasksCompleted / 30).toFixed(1)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Active time per day</span>
                        <span className="font-medium">
                          {Math.floor(analytics.mining.activeTime / 30)} minutes
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Best day</span>
                        <span className="font-medium">42.5 MINER</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Current streak</span>
                        <span className="font-medium">12 days</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Staking Tab */}
          <TabsContent value="staking">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Staking Overview
                  </CardTitle>
                  <CardDescription>Your staking positions and rewards</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Total Staked</div>
                      <div className="text-2xl font-bold">{analytics.staking.totalStaked.toLocaleString()} MINER</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Total Rewards</div>
                      <div className="text-2xl font-bold text-success">{analytics.staking.totalRewards.toFixed(0)} MINER</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Average APY</div>
                      <div className="text-2xl font-bold text-primary">{analytics.staking.averageAPY}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Active Positions</div>
                      <div className="text-2xl font-bold">{analytics.staking.currentPositions}</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">Total Profit from Staking</div>
                    <div className="text-3xl font-bold text-success">${analytics.staking.totalProfit.toFixed(2)}</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Staking Performance</CardTitle>
                  <CardDescription>Your staking strategy effectiveness</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Return on Investment</span>
                        <span className="font-medium text-success">+4.26%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Monthly earnings</span>
                        <span className="font-medium">{(analytics.staking.totalRewards / 12).toFixed(1)} MINER</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Best performing position</span>
                        <span className="font-medium">25% APY</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total lock time</span>
                        <span className="font-medium">180 days</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Level Progress
                  </CardTitle>
                  <CardDescription>Your current level and experience</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-2">Level {analytics.performance.currentLevel}</div>
                    <div className="text-muted-foreground">Rank #{analytics.performance.rank} overall</div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm text-muted-foreground mb-2">
                      <span>Experience Points</span>
                      <span>{analytics.performance.experiencePoints} / {analytics.performance.nextLevelXP}</span>
                    </div>
                    <Progress value={experienceProgress} className="h-3" />
                    <div className="text-xs text-muted-foreground mt-1">
                      {analytics.performance.nextLevelXP - analytics.performance.experiencePoints} XP to next level
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-primary">
                      Top {analytics.performance.percentile.toFixed(1)}% of all miners
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Achievements
                  </CardTitle>
                  <CardDescription>Your earned badges and accomplishments</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground mb-3">
                      {analytics.performance.achievements.length} achievements unlocked
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {analytics.performance.achievements.map((achievement, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {achievement}
                        </Badge>
                      ))}
                    </div>
                    <div className="pt-4 border-t">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Referral Count</div>
                          <div className="font-semibold">{analytics.referrals.totalReferrals}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Referral Bonus</div>
                          <div className="font-semibold">${analytics.referrals.totalBonusEarned.toFixed(0)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Active Referrals</div>
                          <div className="font-semibold">{analytics.referrals.activeReferrals}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Conversion Rate</div>
                          <div className="font-semibold">{analytics.referrals.conversionRate}%</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}