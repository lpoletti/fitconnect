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
  variant?: 'full' | 'mini'
}

export function RestTimer({
  duration = 60,
  autoStart = true,
  onSkip,
  onComplete,
  onAddTime,
  variant = 'full',
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

  const addTime = useCallback((seconds: number) => {
    setTimeLeft((prev) => prev + seconds)
    if (onAddTime) onAddTime(seconds)
  }, [onAddTime])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  if (variant === 'mini') {
    const size = 38
    const stroke = 3
    const radius = (size - stroke) / 2
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (progress / 100) * circumference

    return (
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onSkip(); }}
        className="relative inline-flex items-center justify-center cursor-pointer group"
        title="Pular descanso"
      >
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--primary) / 0.15)" strokeWidth={stroke} />
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--primary))" strokeWidth={stroke}
            strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
            className="transition-all duration-1000 ease-linear" />
        </svg>
        <span className="absolute text-[10px] font-bold text-white font-mono">{timeLeft}</span>
        <div className="absolute inset-0 rounded-full bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <SkipForward className="h-3 w-3 text-primary" />
        </div>
      </button>
    )
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
            onClick={() => addTime(30)}
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
