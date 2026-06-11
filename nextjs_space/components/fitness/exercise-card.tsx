'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Target } from 'lucide-react'

interface ExerciseCardProps {
  name: string
  series: number
  reps: number
  weight?: number
  muscleGroup: string
  onSelect?: () => void
}

export function ExerciseCard({ name, series, reps, weight, muscleGroup, onSelect }: ExerciseCardProps) {
  return (
    <Card
      className="cursor-pointer border-0 bg-surface transition-all duration-200 hover:bg-surface-elevated"
      onClick={onSelect}
    >
      <CardContent className="flex items-center gap-4 p-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Target className="h-5 w-5 text-primary" />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-body-md font-semibold text-foreground truncate">{name}</h4>
          <p className="mt-0.5 text-body-sm text-muted-foreground">
            {series}x{reps}
            {weight ? ` - ${weight}kg` : ''}
          </p>
        </div>

        <Badge variant="secondary" className="shrink-0 text-caption">
          {muscleGroup}
        </Badge>
      </CardContent>
    </Card>
  )
}
