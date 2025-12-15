'use client'

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  isLoading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  fullWidth?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = `
      inline-flex items-center justify-center gap-2
      font-semibold rounded-2xl
      transition-all duration-200 ease-out
      focus:outline-none focus:ring-2 focus:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed
      min-h-[48px]
    `

    const variants = {
      primary: `
        bg-gradient-to-r from-primary-500 to-primary-600
        text-white
        hover:from-primary-400 hover:to-primary-500
        focus:ring-primary-500
        shadow-md hover:shadow-lg
      `,
      secondary: `
        bg-gradient-to-r from-secondary-500 to-secondary-600
        text-white
        hover:from-secondary-400 hover:to-secondary-500
        focus:ring-secondary-500
        shadow-md hover:shadow-lg
      `,
      outline: `
        border-2 border-neutral-300
        text-neutral-700
        hover:border-primary-500 hover:text-primary-600
        focus:ring-primary-500
        bg-transparent
      `,
      ghost: `
        text-neutral-600
        hover:bg-neutral-100 hover:text-neutral-900
        focus:ring-neutral-400
        bg-transparent
      `,
      danger: `
        bg-gradient-to-r from-error-500 to-error-600
        text-white
        hover:from-error-400 hover:to-error-500
        focus:ring-error-500
        shadow-md hover:shadow-lg
      `,
    }

    const sizes = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg',
      xl: 'px-10 py-5 text-xl',
    }

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button }
export type { ButtonProps }
