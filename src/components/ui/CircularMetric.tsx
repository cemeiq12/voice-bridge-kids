'use client'

import { cn } from '@/lib/utils'

interface CircularMetricProps {
  value: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  label: string
  sublabel?: string
  color?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning'
  className?: string
}

export function CircularMetric({
  value,
  max = 100,
  size = 'md',
  label,
  sublabel,
  color = 'primary',
  className,
}: CircularMetricProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  const sizes = {
    sm: { outer: 80, stroke: 6, textSize: 'text-lg', labelSize: 'text-xs' },
    md: { outer: 112, stroke: 8, textSize: 'text-2xl', labelSize: 'text-sm' },
    lg: { outer: 140, stroke: 10, textSize: 'text-3xl', labelSize: 'text-base' },
  }

  const colors = {
    primary: { stroke: '#778873', bg: '#F1F3E0' },
    secondary: { stroke: '#9D8F6F', bg: '#F7F6F0' },
    accent: { stroke: '#528B7A', bg: '#EEF4F2' },
    success: { stroke: '#4A8A4A', bg: '#F0F6F0' },
    warning: { stroke: '#D4901F', bg: '#FDF8EE' },
  }

  const config = sizes[size]
  const colorConfig = colors[color]
  const radius = (config.outer - config.stroke) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div className="relative" style={{ width: config.outer, height: config.outer }}>
        <svg
          width={config.outer}
          height={config.outer}
          viewBox={`0 0 ${config.outer} ${config.outer}`}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={config.outer / 2}
            cy={config.outer / 2}
            r={radius}
            fill="none"
            stroke={colorConfig.bg}
            strokeWidth={config.stroke}
          />
          {/* Progress circle */}
          <circle
            cx={config.outer / 2}
            cy={config.outer / 2}
            r={radius}
            fill="none"
            stroke={colorConfig.stroke}
            strokeWidth={config.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn('font-bold text-neutral-800', config.textSize)}>
            {Math.round(percentage)}%
          </span>
        </div>
      </div>
      {/* Labels */}
      <div className="mt-3 text-center">
        <div className="flex items-center justify-center gap-1.5">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: colorConfig.stroke }}
          />
          <span className={cn('font-semibold text-neutral-800', config.labelSize)}>
            {label}
          </span>
        </div>
        {sublabel && (
          <p className="text-xs text-neutral-500 mt-1 max-w-[120px]">{sublabel}</p>
        )}
      </div>
    </div>
  )
}
