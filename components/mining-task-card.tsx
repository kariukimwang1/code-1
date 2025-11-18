"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Zap } from "lucide-react"

interface Task {
  id: string
  name: string
  type: string
  reward: number
  duration: string
  difficulty: string
  description: string
}

interface Props {
  task: Task
  onStart: () => void
}

const difficultyColors: Record<string, string> = {
  easy: "bg-success/20 text-success",
  medium: "bg-warning/20 text-warning",
  hard: "bg-destructive/20 text-destructive",
}

export function MiningTaskCard({ task, onStart }: Props) {
  return (
    <Card className="card-hover hover:border-primary transition-colors">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{task.name}</CardTitle>
            <CardDescription>{task.description}</CardDescription>
          </div>
          <Badge className={difficultyColors[task.difficulty]}>{task.difficulty}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Zap className="h-4 w-4 text-accent" />
              <span className="font-semibold">{task.reward} MINER</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{task.duration}</span>
            </div>
          </div>
          <Button onClick={onStart} className="w-full btn-primary">
            Start Task
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
