'use client'

import { Check, X, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SeriesTrackerProps {
  currentSeries: number
  totalSeries: number
  weight?: number | string
  reps?: number | string
  onComplete: () => void
  onFail?: () => void
  onAddSeries?: () => void
  variant?: 'full' | 'compact'
  className?: string
}

export function SeriesTracker({
  currentSeries,
  totalSeries,
  weight,
  reps,
  onComplete,
  onFail,
  onAddSeries,
  variant = 'full',
  className,
}: SeriesTrackerProps) {
  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-4 py-2', className)}>
        <div className="flex items-center gap-1.5">
          {Array.from({ length: totalSeries }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                totalSeries > 8 ? 'w-4' : 'w-6',
                i < currentSeries
                  ? 'bg-primary'
                  : i === currentSeries
                    ? 'bg-primary/40 ring-2 ring-primary/30'
                    : 'bg-surface-elevated'
              )}
            />
          ))}
        </div>

        <div className="flex items-center gap-3 text-sm">
          <div className="text-center">
            <p className="text-caption text-muted-foreground text-[9px]">CARGA</p>
            <p className="font-bold text-foreground text-xs">{weight ?? '-'} <span className="text-muted-foreground text-[9px]">kg</span></p>
          </div>
          <div className="text-center">
            <p className="text-caption text-muted-foreground text-[9px]">REPS</p>
            <p className="font-bold text-foreground text-xs">{reps ?? '-'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {onFail && (
            <Button
              variant="secondary"
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={onFail}
            >
              <X className="h-4 w-4 text-destructive" />
            </Button>
          )}

          <Button
            size="sm"
            className="h-10 w-10 rounded-full p-0 shadow-md shadow-primary/20"
            onClick={onComplete}
          >
            <Check className="h-5 w-5" />
          </Button>

          {onAddSeries && (
            <Button
              variant="secondary"
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={onAddSeries}
            >
              <Plus className="h-4 w-4 text-primary" />
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col items-center gap-4 px-6 py-4', className)}>
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
