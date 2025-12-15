'use client'

import { cn } from '@/lib/utils'

type EmotionType = 'happy' | 'calm' | 'frustrated' | 'anxious' | 'confident' | 'neutral'

interface EmotionBadgeProps {
  emotion: EmotionType
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

const emotionConfig: Record<EmotionType, { emoji: string; label: string; bg: string; text: string }> = {
  happy: { emoji: '😊', label: 'Happy', bg: 'bg-success-100', text: 'text-success-700' },
  calm: { emoji: '😌', label: 'Calm', bg: 'bg-accent-100', text: 'text-accent-700' },
  frustrated: { emoji: '😤', label: 'Frustrated', bg: 'bg-warning-100', text: 'text-warning-700' },
  anxious: { emoji: '😰', label: 'Anxious', bg: 'bg-secondary-100', text: 'text-secondary-700' },
  confident: { emoji: '😎', label: 'Confident', bg: 'bg-primary-100', text: 'text-primary-700' },
  neutral: { emoji: '😐', label: 'Neutral', bg: 'bg-neutral-100', text: 'text-neutral-700' },
}

export function EmotionBadge({
  emotion,
  size = 'md',
  showLabel = true,
  className,
}: EmotionBadgeProps) {
  const config = emotionConfig[emotion]

  const sizes = {
    sm: { emoji: 'text-lg', padding: 'px-2 py-1', text: 'text-xs' },
    md: { emoji: 'text-xl', padding: 'px-3 py-1.5', text: 'text-sm' },
    lg: { emoji: 'text-2xl', padding: 'px-4 py-2', text: 'text-base' },
  }

  const sizeConfig = sizes[size]

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full font-medium',
        config.bg,
        config.text,
        sizeConfig.padding,
        className
      )}
    >
      <span className={sizeConfig.emoji}>{config.emoji}</span>
      {showLabel && <span className={sizeConfig.text}>{config.label}</span>}
    </div>
  )
}
