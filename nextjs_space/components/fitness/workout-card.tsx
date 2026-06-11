'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, Dumbbell, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface WorkoutCardProps {
  name: string
  exercises: number
  duration: number
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  onStart?: () => void
}

const difficultyConfig = {
  beginner: { label: 'Iniciante', variant: 'outline' as const },
  intermediate: { label: 'Intermediario', variant: 'default' as const },
  advanced: { label: 'Avancado', variant: 'destructive' as const },
}

export function WorkoutCard({ name, exercises, duration, difficulty = 'intermediate', onStart }: WorkoutCardProps) {
  const config = difficultyConfig[difficulty]

  return (
    <Card className="group relative overflow-hidden border-0 bg-surface transition-all duration-200 hover:shadow-lg hover:shadow-primary/5">
      <CardContent className="flex items-center gap-4 p-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Dumbbell className="h-6 w-6 text-primary" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-title-md font-semibold text-foreground truncate">{name}</h3>
          <div className="mt-1 flex items-center gap-3 text-body-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Dumbbell className="h-3.5 w-3.5" />
              {exercises} exerciocios
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {duration}min
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant={config.variant} className="hidden sm:inline-flex">
            {config.label}
          </Badge>
          <Button size="icon" className="h-10 w-10 shrink-0 rounded-full" onClick={onStart}>
            <Play className="h-4 w-4 fill-current" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
