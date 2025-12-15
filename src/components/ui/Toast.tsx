'use client'

import { useEffect } from 'react'
import { cn } from '@/lib/utils'

export interface ToastProps {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
  duration?: number
  onClose: (id: string) => void
}

export function Toast({ id, type, message, duration = 5000, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id)
    }, duration)

    return () => clearTimeout(timer)
  }, [id, duration, onClose])

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        'min-w-[300px] max-w-md p-4 rounded-xl shadow-lg flex items-start gap-3',
        'animate-slideIn backdrop-blur-sm',
        type === 'success' && 'bg-green-50 border-2 border-green-500',
        type === 'error' && 'bg-red-50 border-2 border-red-500',
        type === 'info' && 'bg-blue-50 border-2 border-blue-500'
      )}
    >
      {/* Icon */}
      <div className="flex-shrink-0">
        {type === 'success' && (
          <svg
            className="w-6 h-6 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        )}
        {type === 'error' && (
          <svg
            className="w-6 h-6 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        )}
        {type === 'info' && (
          <svg
            className="w-6 h-6 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        )}
      </div>

      {/* Message */}
      <p
        className={cn(
          'flex-1 text-sm font-medium',
          type === 'success' && 'text-green-800',
          type === 'error' && 'text-red-800',
          type === 'info' && 'text-blue-800'
        )}
      >
        {message}
      </p>

      {/* Close button */}
      <button
        onClick={() => onClose(id)}
        className={cn(
          'flex-shrink-0 p-1 rounded-lg transition-colors',
          type === 'success' && 'hover:bg-green-100 text-green-600',
          type === 'error' && 'hover:bg-red-100 text-red-600',
          type === 'info' && 'hover:bg-blue-100 text-blue-600'
        )}
        aria-label="Close notification"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  )
}
