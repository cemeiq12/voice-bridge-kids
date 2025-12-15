'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface AudioWaveformProps {
  isActive?: boolean
  barCount?: number
  variant?: 'default' | 'gradient' | 'minimal'
  className?: string
}

export function AudioWaveform({
  isActive = false,
  barCount = 20,
  variant = 'default',
  className,
}: AudioWaveformProps) {
  const [heights, setHeights] = useState<number[]>(
    Array(barCount).fill(0).map(() => 0.2)
  )

  useEffect(() => {
    if (!isActive) {
      setHeights(Array(barCount).fill(0.2))
      return
    }

    const interval = setInterval(() => {
      setHeights(
        Array(barCount)
          .fill(0)
          .map((_, i) => {
            // Create a wave pattern that's higher in the middle
            const middleDistance = Math.abs(i - barCount / 2) / (barCount / 2)
            const baseHeight = 0.3 + (1 - middleDistance) * 0.4
            return baseHeight + Math.random() * 0.3
          })
      )
    }, 100)

    return () => clearInterval(interval)
  }, [isActive, barCount])

  const getBarStyle = (index: number) => {
    if (variant === 'gradient') {
      // Cyan -> Purple -> Pink gradient
      const progress = index / barCount
      if (progress < 0.33) {
        return 'bg-accent-400'
      } else if (progress < 0.66) {
        return 'bg-primary-500'
      } else {
        return 'bg-secondary-400'
      }
    }
    return 'bg-primary-400'
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center gap-[3px] h-16',
        className
      )}
    >
      {heights.map((height, index) => (
        <div
          key={index}
          className={cn(
            'w-1 rounded-full transition-all duration-100',
            getBarStyle(index),
            !isActive && 'opacity-40'
          )}
          style={{
            height: `${height * 100}%`,
            minHeight: '8px',
          }}
        />
      ))}
    </div>
  )
}
