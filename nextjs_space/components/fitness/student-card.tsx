'use client'

import { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'

interface StudentCardProps {
  name: string
  photoUrl?: string
  lastWorkout: string | null
  weeklyProgress: number
  status: 'active' | 'inactive' | 'injured'
  onSelect?: () => void
}

const statusConfig = {
  active: { label: 'Ativo', variant: 'outline' as const, dotClass: 'bg-success' },
  inactive: { label: 'Inativo', variant: 'secondary' as const, dotClass: 'bg-muted-foreground' },
  injured: { label: 'Lesionado', variant: 'destructive' as const, dotClass: 'bg-destructive' },
}

function formatLastWorkout(lastWorkout: string | null): {
  label: string
  colorClass: string
} {
  if (!lastWorkout) {
    return { label: 'Nunca treinou', colorClass: 'text-muted-foreground' }
  }

  const now = Date.now()
  const workoutDate = new Date(lastWorkout).getTime()
  const diffDays = Math.floor((now - workoutDate) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return { label: 'Hoje', colorClass: 'text-green-600' }
  if (diffDays === 0) return { label: 'Hoje', colorClass: 'text-green-600' }
  if (diffDays === 1) return { label: 'Ontem', colorClass: 'text-green-600' }
  if (diffDays <= 3) return { label: `Ha ${diffDays} dias`, colorClass: 'text-green-600' }
  if (diffDays <= 7) return { label: `Ha ${diffDays} dias`, colorClass: 'text-amber-600' }
  return { label: `Ha ${diffDays} dias`, colorClass: 'text-red-600' }
}

export function StudentCard({
  name,
  photoUrl,
  lastWorkout,
  weeklyProgress,
  status,
  onSelect,
}: StudentCardProps) {
  const config = statusConfig[status]
  const workoutInfo = useMemo(() => formatLastWorkout(lastWorkout), [lastWorkout])

  return (
    <Card
      className="cursor-pointer border-0 bg-surface transition-all duration-200 hover:bg-surface-elevated"
      onClick={onSelect}
    >
      <CardContent className="flex items-center gap-4 p-4">
        <Avatar className="h-10 w-10">
          <AvatarImage src={photoUrl} />
          <AvatarFallback className="bg-primary/20 text-title-md text-primary">
            {name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-title-sm font-semibold text-foreground truncate">{name}</h4>
            <div className={`h-2 w-2 rounded-full ${config.dotClass}`} />
          </div>
          <p className="text-body-sm">
            <span className="text-muted-foreground">Ultimo treino: </span>
            <span className={`font-medium ${workoutInfo.colorClass}`}>{workoutInfo.label}</span>
          </p>
          <div className="mt-2 flex items-center gap-2">
            <Progress value={weeklyProgress} className="h-1.5 flex-1" />
            <span className="text-caption text-muted-foreground shrink-0">{weeklyProgress}%</span>
          </div>
        </div>

        <Badge variant={config.variant} className="shrink-0">
          {config.label}
        </Badge>
      </CardContent>
    </Card>
  )
}
