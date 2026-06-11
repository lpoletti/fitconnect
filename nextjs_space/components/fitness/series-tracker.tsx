'use client'

import { Check, X, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SeriesTrackerProps {
  currentSeries: number
  totalSeries: number
  weight?: number
  reps?: number
  onComplete: () => void
  onFail?: () => void
  onAddSeries?: () => void
}

export function SeriesTracker({
  currentSeries,
  totalSeries,
  weight,
  reps,
  onComplete,
  onFail,
  onAddSeries,
}: SeriesTrackerProps) {
  return (
    <div className="flex flex-col items-center gap-4 px-6 py-4">
      <div className="flex items-center gap-3">
        {Array.from({ length: totalSeries }).map((_, i) => (
          <div
            key={i}
            className={`h-2.5 w-12 rounded-full transition-all duration-300 ${
              i < currentSeries
                ? 'bg-primary'
                : i === currentSeries
                  ? 'bg-primary/40 ring-2 ring-primary/30'
                  : 'bg-surface-elevated'
            }`}
          />
        ))}
      </div>

      <div className="flex items-center gap-6">
        <div className="text-center">
          <p className="text-caption text-muted-foreground">CARGA</p>
          <p className="text-heading-2 font-bold text-foreground">{weight ?? '-'} <span className="text-body-sm text-muted-foreground">kg</span></p>
        </div>
        <div className="text-center">
          <p className="text-caption text-muted-foreground">REPETICOES</p>
          <p className="text-heading-2 font-bold text-foreground">{reps ?? '-'} <span className="text-body-sm text-muted-foreground">rep</span></p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {onFail && (
          <Button
            variant="secondary"
            size="icon"
            className="h-14 w-14 rounded-full"
            onClick={onFail}
          >
            <X className="h-6 w-6 text-destructive" />
          </Button>
        )}

        <Button
          size="lg"
          className="h-16 w-16 rounded-full shadow-lg shadow-primary/20"
          onClick={onComplete}
        >
          <Check className="h-7 w-7" />
        </Button>

        {onAddSeries && (
          <Button
            variant="secondary"
            size="icon"
            className="h-14 w-14 rounded-full"
            onClick={onAddSeries}
          >
            <Plus className="h-6 w-6 text-primary" />
          </Button>
        )}
      </div>
    </div>
  )
}
