'use client'

import { cn } from '@/lib/utils'

interface PhonemeAnimationProps {
  phonemeId: string
  isAnimating: boolean
  className?: string
}

export function PhonemeAnimation({
  phonemeId,
  isAnimating,
  className,
}: PhonemeAnimationProps) {
  // Common animation classes
  const animationClass = isAnimating ? 'animate-pulse' : ''

  // Render different SVG based on phoneme
  const renderAnimation = () => {
    switch (phonemeId) {
      case 'th':
        return (
          <svg viewBox="0 0 200 150" className={cn('w-full h-full', className)}>
            {/* Face */}
            <ellipse cx="100" cy="75" rx="80" ry="65" fill="#fce7d6" stroke="#e5c5b5" strokeWidth="2" />
            {/* Upper lip */}
            <path d="M 55 85 Q 100 78 145 85" fill="#e88b8b" stroke="#d47a7a" strokeWidth="2" />
            {/* Lower lip */}
            <path d="M 55 85 Q 100 92 145 85" fill="#e88b8b" stroke="#d47a7a" strokeWidth="2" />
            {/* Upper teeth */}
            <path
              d="M 80 82 L 80 88 M 90 80 L 90 86 M 100 79 L 100 85 M 110 80 L 110 86 M 120 82 L 120 88"
              stroke="white"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Lower teeth */}
            <path
              d="M 80 92 L 80 98 M 90 94 L 90 100 M 100 95 L 100 101 M 110 94 L 110 100 M 120 92 L 120 98"
              stroke="white"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Tongue between teeth - key feature for TH */}
            <ellipse
              cx="100"
              cy={isAnimating ? '87' : '90'}
              rx="18"
              ry="6"
              fill="#ff9999"
              className="transition-all duration-300"
            />
            {/* Airflow indicator */}
            {isAnimating && (
              <>
                <circle cx="75" cy="87" r="2" fill="#a0d0ff" className="animate-ping" />
                <circle cx="85" cy="87" r="2" fill="#a0d0ff" className="animate-ping" style={{ animationDelay: '0.1s' }} />
                <circle cx="115" cy="87" r="2" fill="#a0d0ff" className="animate-ping" style={{ animationDelay: '0.2s' }} />
                <circle cx="125" cy="87" r="2" fill="#a0d0ff" className="animate-ping" style={{ animationDelay: '0.3s' }} />
              </>
            )}
          </svg>
        )

      case 'r':
        return (
          <svg viewBox="0 0 200 150" className={cn('w-full h-full', className)}>
            {/* Face */}
            <ellipse cx="100" cy="75" rx="80" ry="65" fill="#fce7d6" stroke="#e5c5b5" strokeWidth="2" />
            {/* Lips - slightly rounded */}
            <ellipse
              cx="100"
              cy="90"
              rx={isAnimating ? '22' : '20'}
              ry={isAnimating ? '14' : '12'}
              fill="#e88b8b"
              stroke="#d47a7a"
              strokeWidth="2"
              className="transition-all duration-300"
            />
            {/* Mouth opening */}
            <ellipse cx="100" cy="90" rx="14" ry="8" fill="#8b0000" />
            {/* Tongue curled back */}
            <path
              d={isAnimating ? 'M 85 95 Q 100 85 115 95' : 'M 85 95 Q 100 88 115 95'}
              fill="#ff9999"
              stroke="#ff7777"
              strokeWidth="2"
              className="transition-all duration-300"
            />
            {/* Roof of mouth */}
            <path d="M 80 75 Q 100 70 120 75" stroke="#ffcccc" strokeWidth="2" fill="none" />
          </svg>
        )

      case 's':
        return (
          <svg viewBox="0 0 200 150" className={cn('w-full h-full', className)}>
            {/* Face */}
            <ellipse cx="100" cy="75" rx="80" ry="65" fill="#fce7d6" stroke="#e5c5b5" strokeWidth="2" />
            {/* Lips - slight smile */}
            <path
              d="M 60 88 Q 100 82 140 88"
              fill="none"
              stroke="#e88b8b"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path
              d="M 60 88 Q 100 94 140 88"
              fill="none"
              stroke="#e88b8b"
              strokeWidth="3"
              strokeLinecap="round"
            />
            {/* Upper teeth */}
            <path
              d="M 80 84 L 80 89 M 90 83 L 90 88 M 100 82 L 100 87 M 110 83 L 110 88 M 120 84 L 120 89"
              stroke="white"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Tongue behind teeth */}
            <ellipse cx="100" cy="94" rx="20" ry="6" fill="#ff9999" />
            {/* Airflow - snake hiss */}
            {isAnimating && (
              <>
                <path
                  d="M 140 88 L 155 88"
                  stroke="#a0d0ff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className="animate-pulse"
                />
                <path
                  d="M 145 88 L 160 88"
                  stroke="#a0d0ff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className="animate-pulse"
                  style={{ animationDelay: '0.2s' }}
                />
              </>
            )}
          </svg>
        )

      case 'l':
        return (
          <svg viewBox="0 0 200 150" className={cn('w-full h-full', className)}>
            {/* Face */}
            <ellipse cx="100" cy="75" rx="80" ry="65" fill="#fce7d6" stroke="#e5c5b5" strokeWidth="2" />
            {/* Lips - relaxed */}
            <ellipse cx="100" cy="88" rx="20" ry="10" fill="#e88b8b" stroke="#d47a7a" strokeWidth="2" />
            {/* Mouth opening */}
            <ellipse cx="100" cy="88" rx="14" ry="6" fill="#8b0000" />
            {/* Alveolar ridge */}
            <path d="M 85 75 Q 100 72 115 75" stroke="#ffcccc" strokeWidth="3" fill="none" />
            {/* Tongue touching alveolar ridge */}
            <ellipse
              cx="100"
              cy={isAnimating ? '75' : '78'}
              rx="16"
              ry="8"
              fill="#ff9999"
              className="transition-all duration-300"
            />
            {/* Airflow over sides */}
            {isAnimating && (
              <>
                <circle cx="78" cy="85" r="2" fill="#a0d0ff" className="animate-ping" />
                <circle cx="122" cy="85" r="2" fill="#a0d0ff" className="animate-ping" style={{ animationDelay: '0.15s' }} />
              </>
            )}
          </svg>
        )

      case 'sh':
        return (
          <svg viewBox="0 0 200 150" className={cn('w-full h-full', className)}>
            {/* Face */}
            <ellipse cx="100" cy="75" rx="80" ry="65" fill="#fce7d6" stroke="#e5c5b5" strokeWidth="2" />
            {/* Rounded lips pushed forward */}
            <ellipse
              cx="100"
              cy="90"
              rx={isAnimating ? '18' : '16'}
              ry={isAnimating ? '16' : '14'}
              fill="#e88b8b"
              stroke="#d47a7a"
              strokeWidth="2"
              className="transition-all duration-300"
            />
            {/* Mouth opening - small circle */}
            <circle cx="100" cy="90" r="8" fill="#8b0000" />
            {/* Raised tongue */}
            <ellipse cx="100" cy="92" rx="14" ry="6" fill="#ff9999" />
            {/* Airflow through center */}
            {isAnimating && (
              <>
                <circle cx="100" cy="80" r="2" fill="#a0d0ff" className="animate-ping" />
                <circle cx="100" cy="75" r="2" fill="#a0d0ff" className="animate-ping" style={{ animationDelay: '0.15s' }} />
                <circle cx="100" cy="70" r="2" fill="#a0d0ff" className="animate-ping" style={{ animationDelay: '0.3s' }} />
              </>
            )}
          </svg>
        )

      case 'ch':
        return (
          <svg viewBox="0 0 200 150" className={cn('w-full h-full', className)}>
            {/* Face */}
            <ellipse cx="100" cy="75" rx="80" ry="65" fill="#fce7d6" stroke="#e5c5b5" strokeWidth="2" />
            {/* Rounded lips */}
            <ellipse cx="100" cy="90" rx="18" ry="13" fill="#e88b8b" stroke="#d47a7a" strokeWidth="2" />
            {/* Mouth opening */}
            <ellipse cx="100" cy="90" rx="12" ry="8" fill="#8b0000" />
            {/* Tongue at alveolar ridge */}
            <ellipse
              cx="100"
              cy={isAnimating ? '78' : '82'}
              rx="16"
              ry="7"
              fill="#ff9999"
              className="transition-all duration-300"
            />
            {/* Burst of air */}
            {isAnimating && (
              <>
                <circle cx="115" cy="85" r="3" fill="#a0d0ff" className="animate-ping" />
                <circle cx="125" cy="85" r="3" fill="#a0d0ff" className="animate-ping" style={{ animationDelay: '0.1s' }} />
                <circle cx="135" cy="85" r="3" fill="#a0d0ff" className="animate-ping" style={{ animationDelay: '0.2s' }} />
              </>
            )}
          </svg>
        )

      case 'k':
      case 'g':
        return (
          <svg viewBox="0 0 200 150" className={cn('w-full h-full', className)}>
            {/* Face */}
            <ellipse cx="100" cy="75" rx="80" ry="65" fill="#fce7d6" stroke="#e5c5b5" strokeWidth="2" />
            {/* Lips - neutral */}
            <ellipse cx="100" cy="90" rx="20" ry="10" fill="#e88b8b" stroke="#d47a7a" strokeWidth="2" />
            {/* Soft palate */}
            <path d="M 85 65 Q 100 60 115 65" stroke="#ffcccc" strokeWidth="3" fill="none" />
            {/* Back of tongue raised */}
            <ellipse
              cx="100"
              cy={isAnimating ? '65' : '70'}
              rx="22"
              ry="10"
              fill="#ff9999"
              className="transition-all duration-300"
            />
            {/* Air burst */}
            {isAnimating && (
              <>
                <circle cx="120" cy="85" r="3" fill="#a0d0ff" className="animate-ping" />
                <circle cx="130" cy="85" r="3" fill="#a0d0ff" className="animate-ping" style={{ animationDelay: '0.1s' }} />
              </>
            )}
          </svg>
        )

      case 'p':
      case 'b':
        return (
          <svg viewBox="0 0 200 150" className={cn('w-full h-full', className)}>
            {/* Face */}
            <ellipse cx="100" cy="75" rx="80" ry="65" fill="#fce7d6" stroke="#e5c5b5" strokeWidth="2" />
            {/* Upper lip */}
            <path
              d={isAnimating ? 'M 60 85 Q 100 85 140 85' : 'M 60 88 Q 100 88 140 88'}
              fill="#e88b8b"
              stroke="#d47a7a"
              strokeWidth="3"
              strokeLinecap="round"
              className="transition-all duration-300"
            />
            {/* Lower lip */}
            <path
              d={isAnimating ? 'M 60 85 Q 100 85 140 85' : 'M 60 92 Q 100 92 140 92'}
              fill="#e88b8b"
              stroke="#d47a7a"
              strokeWidth="3"
              strokeLinecap="round"
              className="transition-all duration-300"
            />
            {/* Air burst */}
            {isAnimating && (
              <>
                <circle cx="110" cy="90" r="3" fill="#a0d0ff" className="animate-ping" />
                <circle cx="120" cy="90" r="3" fill="#a0d0ff" className="animate-ping" style={{ animationDelay: '0.1s' }} />
                <circle cx="130" cy="90" r="3" fill="#a0d0ff" className="animate-ping" style={{ animationDelay: '0.2s' }} />
              </>
            )}
          </svg>
        )

      case 'f':
      case 'v':
        return (
          <svg viewBox="0 0 200 150" className={cn('w-full h-full', className)}>
            {/* Face */}
            <ellipse cx="100" cy="75" rx="80" ry="65" fill="#fce7d6" stroke="#e5c5b5" strokeWidth="2" />
            {/* Upper teeth on lower lip */}
            <path
              d="M 85 82 L 85 88 M 95 80 L 95 86 M 105 79 L 105 85 M 115 80 L 115 86"
              stroke="white"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Lower lip */}
            <ellipse
              cx="100"
              cy={isAnimating ? '88' : '90'}
              rx="20"
              ry="6"
              fill="#e88b8b"
              stroke="#d47a7a"
              strokeWidth="2"
              className="transition-all duration-300"
            />
            {/* Airflow */}
            {isAnimating && (
              <>
                <path d="M 120 84 L 135 84" stroke="#a0d0ff" strokeWidth="2" className="animate-pulse" />
                <path d="M 125 84 L 140 84" stroke="#a0d0ff" strokeWidth="2" className="animate-pulse" style={{ animationDelay: '0.2s' }} />
              </>
            )}
          </svg>
        )

      default:
        return (
          <svg viewBox="0 0 200 150" className={cn('w-full h-full', className)}>
            {/* Generic face */}
            <ellipse cx="100" cy="75" rx="80" ry="65" fill="#fce7d6" stroke="#e5c5b5" strokeWidth="2" />
            <ellipse
              cx="100"
              cy="90"
              rx={isAnimating ? '22' : '20'}
              ry={isAnimating ? '12' : '10'}
              fill="#e88b8b"
              stroke="#d47a7a"
              strokeWidth="2"
              className="transition-all duration-300"
            />
            <ellipse cx="100" cy="95" rx="18" ry="8" fill="#ff9999" />
          </svg>
        )
    }
  }

  return (
    <div className="relative bg-gradient-to-br from-primary-50 to-secondary-50 rounded-3xl p-8">
      <div className="aspect-video max-w-md mx-auto">
        {renderAnimation()}
      </div>
    </div>
  )
}
