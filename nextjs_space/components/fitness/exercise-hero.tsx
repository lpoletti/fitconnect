'use client'

import { Target, ArrowLeft, ArrowRight } from 'lucide-react'

interface ExerciseHeroProps {
  name: string
  muscleGroup: string
  currentSeries: number
  totalSeries: number
  imageUrl?: string
}

export function ExerciseHero({ name, muscleGroup, currentSeries, totalSeries, imageUrl }: ExerciseHeroProps) {
  return (
    <div className="relative flex flex-col items-center justify-center px-6 py-8 text-center">
      {imageUrl ? (
        <div className="mb-4 h-32 w-32 overflow-hidden rounded-2xl bg-surface">
          <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
        </div>
      ) : (
        <div className="mb-4 flex h-32 w-32 items-center justify-center rounded-2xl bg-primary/10">
          <Target className="h-14 w-14 text-primary" />
        </div>
      )}

      <h1 className="text-heading-1 font-bold text-foreground">{name}</h1>
      <p className="mt-1 text-body-md text-muted-foreground">{muscleGroup}</p>

      <div className="mt-4 flex items-center gap-4 text-body-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4 opacity-50" />
        <span className="rounded-full bg-primary/10 px-4 py-1.5 text-title-sm font-semibold text-primary">
          Serie {currentSeries} de {totalSeries}
        </span>
        <ArrowRight className="h-4 w-4 opacity-50" />
      </div>
    </div>
  )
}
