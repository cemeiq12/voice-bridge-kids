'use client'

import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string | number
  icon?: React.ReactNode
  trend?: 'up' | 'down' | 'neutral' | { value: number; isPositive: boolean }
  trendValue?: string
  progress?: number
  progressColor?: 'primary' | 'secondary' | 'accent'
  className?: string
}

export function StatCard({
  label,
  value,
  icon,
  trend,
  trendValue,
  progress,
  progressColor = 'primary',
  className,
}: StatCardProps) {
  const progressColors = {
    primary: 'from-primary-500 to-primary-400',
    secondary: 'from-secondary-500 to-secondary-400',
    accent: 'from-accent-500 to-accent-400',
  }

  const renderTrend = () => {
    if (!trend) return null

    if (typeof trend === 'object') {
      return (
        <span
          className={cn(
            'text-xs font-medium mb-1',
            trend.isPositive ? 'text-success-600' : 'text-error-500'
          )}
        >
          {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
        </span>
      )
    }

    if (trend === 'neutral') return null

    const isPositive = trend === 'up'
    return (
      <span
        className={cn(
          'text-xs font-medium mb-1',
          isPositive ? 'text-success-600' : 'text-error-500'
        )}
      >
        {isPositive ? '↑' : '↓'} {trendValue || ''}
      </span>
    )
  }

  return (
    <div className={cn('glass-card-solid p-4', className)}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-sm text-neutral-500">{label}</span>
        {icon && (
          <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center text-primary-500">
            {icon}
          </div>
        )}
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold text-neutral-800">{value}</span>
        {renderTrend()}
      </div>
      {progress !== undefined && (
        <div className="mt-3 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full bg-gradient-to-r transition-all duration-500',
              progressColors[progressColor]
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  )
}
