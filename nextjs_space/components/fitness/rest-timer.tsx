'use client'

import { useEffect, useState, useCallback } from 'react'
import { Play, Pause, SkipForward, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface RestTimerProps {
  duration?: number
  autoStart?: boolean
  onSkip: () => void
  onComplete: () => void
  onAddTime?: (seconds: number) => void
}

export function RestTimer({
  duration = 60,
  autoStart = true,
  onSkip,
  onComplete,
  onAddTime,
}: RestTimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration)
  const [isRunning, setIsRunning] = useState(autoStart)
  const progress = (timeLeft / duration) * 100

  useEffect(() => {
    setTimeLeft(duration)
    setIsRunning(autoStart)
  }, [duration, autoStart])

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          onComplete()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [isRunning, timeLeft, onComplete])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const circumference = 2 * Math.PI * 54
  const offset = circumference - (progress / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-4 px-6 py-6">
      <div className="relative flex items-center justify-center">
        <svg width="128" height="128" className="-rotate-90">
          <circle
            cx="64"
            cy="64"
            r="54"
            fill="none"
            stroke="hsl(var(--surface-elevated))"
            strokeWidth="6"
          />
          <circle
            cx="64"
            cy="64"
            r="54"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
        <span className="absolute text-heading-1 font-bold text-foreground">
          {formatTime(timeLeft)}
        </span>
      </div>

      <p className="text-body-sm text-muted-foreground">Descanso</p>

      <div className="flex items-center gap-3">
        <Button
          variant="secondary"
          size="sm"
          className="h-10 rounded-full"
          onClick={() => setIsRunning(!isRunning)}
        >
          {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {isRunning ? 'Pausar' : 'Continuar'}
        </Button>

        {onAddTime && (
          <Button
            variant="secondary"
            size="sm"
            className="h-10 rounded-full"
            onClick={() => onAddTime(30)}
          >
            <Plus className="h-4 w-4" />
            +30s
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="h-10 rounded-full text-muted-foreground"
          onClick={onSkip}
        >
          <SkipForward className="h-4 w-4" />
          Pular
        </Button>
      </div>
    </div>
  )
}
