'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface WaveformProps {
  isActive?: boolean
  variant?: 'default' | 'minimal' | 'circular'
  color?: 'primary' | 'secondary' | 'white'
  size?: 'sm' | 'md' | 'lg'
  barCount?: number
  className?: string
}

function Waveform({
  isActive = false,
  variant = 'default',
  color = 'primary',
  size = 'md',
  barCount = 7,
  className,
}: WaveformProps) {
  const [heights, setHeights] = useState<number[]>(
    Array(barCount).fill(0).map(() => Math.random() * 0.5 + 0.3)
  )

  useEffect(() => {
    if (!isActive) {
      setHeights(Array(barCount).fill(0.3))
      return
    }

    const interval = setInterval(() => {
      setHeights(
        Array(barCount)
          .fill(0)
          .map(() => Math.random() * 0.7 + 0.3)
      )
    }, 150)

    return () => clearInterval(interval)
  }, [isActive, barCount])

  const colors = {
    primary: 'bg-primary-500',
    secondary: 'bg-secondary-500',
    white: 'bg-white',
  }

  const sizes = {
    sm: { height: 24, width: 3, gap: 2 },
    md: { height: 40, width: 4, gap: 3 },
    lg: { height: 64, width: 6, gap: 4 },
  }

  const sizeConfig = sizes[size]

  if (variant === 'circular') {
    return (
      <div className={cn('relative', className)}>
        <div
          className={cn(
            'rounded-full flex items-center justify-center',
            size === 'sm' && 'w-16 h-16',
            size === 'md' && 'w-24 h-24',
            size === 'lg' && 'w-32 h-32',
            isActive && 'animate-pulse-slow'
          )}
        >
          <div className="flex items-center justify-center gap-1">
            {heights.map((height, index) => (
              <div
                key={index}
                className={cn(
                  'rounded-full transition-all duration-150',
                  colors[color]
                )}
                style={{
                  width: sizeConfig.width,
                  height: height * sizeConfig.height,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'minimal') {
    return (
      <div className={cn('flex items-center', className)} style={{ gap: sizeConfig.gap }}>
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className={cn(
              'rounded-full transition-all duration-200',
              colors[color],
              isActive && 'animate-pulse'
            )}
            style={{
              width: sizeConfig.width,
              height: sizeConfig.width,
              animationDelay: `${index * 0.15}s`,
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <div
      className={cn('flex items-center', className)}
      style={{ gap: sizeConfig.gap, height: sizeConfig.height }}
    >
      {heights.map((height, index) => (
        <div
          key={index}
          className={cn(
            'rounded-full transition-all duration-150 ease-out',
            colors[color]
          )}
          style={{
            width: sizeConfig.width,
            height: `${height * 100}%`,
            transitionDelay: `${index * 20}ms`,
          }}
        />
      ))}
    </div>
  )
}

export { Waveform }
export type { WaveformProps }
