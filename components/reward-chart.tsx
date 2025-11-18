"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const data = [
  { date: "Mon", earned: 45, pending: 12 },
  { date: "Tue", earned: 62, pending: 28 },
  { date: "Wed", earned: 38, pending: 15 },
  { date: "Thu", earned: 71, pending: 35 },
  { date: "Fri", earned: 55, pending: 22 },
  { date: "Sat", earned: 88, pending: 42 },
  { date: "Sun", earned: 76, pending: 31 },
]

export function RewardChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Rewards</CardTitle>
        <CardDescription>Your earned and pending rewards over the last 7 days</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="earned" stroke="#10b981" strokeWidth={2} />
            <Line type="monotone" dataKey="pending" stroke="#8b5cf6" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
