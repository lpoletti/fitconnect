'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, TrendingUp } from 'lucide-react'

interface WorkoutHistoryCardProps {
  date: string
  name: string
  duration: number
  volume: number
  exercises: number
  improved?: boolean
}

export function WorkoutHistoryCard({
  date,
  name,
  duration,
  volume,
  exercises,
  improved,
}: WorkoutHistoryCardProps) {
  return (
    <Card className="border-0 bg-surface transition-all duration-200 hover:bg-surface-elevated">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h4 className="text-title-md font-semibold text-foreground">{name}</h4>
            <div className="flex items-center gap-3 text-body-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {date}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {duration}min
              </span>
            </div>
          </div>
          {improved && (
            <Badge variant="outline" className="border-success/30 bg-success/10 text-success">
              <TrendingUp className="mr-1 h-3 w-3" />
              Melhor
            </Badge>
          )}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 rounded-lg bg-background/50 p-3">
          <div className="text-center">
            <p className="text-caption text-muted-foreground">Volume Total</p>
            <p className="text-title-md font-semibold text-foreground">{volume} kg</p>
          </div>
          <div className="text-center">
            <p className="text-caption text-muted-foreground">Exercicios</p>
            <p className="text-title-md font-semibold text-foreground">{exercises}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
