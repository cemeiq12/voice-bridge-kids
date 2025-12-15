'use client'

import { type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'interactive' | 'highlight' | 'glass'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  children: ReactNode
}

function Card({
  className,
  variant = 'default',
  padding = 'md',
  children,
  ...props
}: CardProps) {
  const variants = {
    default: 'bg-white shadow-soft',
    interactive: 'bg-white shadow-soft hover:shadow-lg hover:-translate-y-1 cursor-pointer hover:ring-2 hover:ring-primary-200',
    highlight: 'bg-gradient-to-br from-primary-50 to-secondary-50 shadow-soft border border-primary-100',
    glass: 'bg-white/80 backdrop-blur-lg shadow-soft',
  }

  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }

  return (
    <div
      className={cn(
        'rounded-3xl transition-all duration-300 ease-out',
        variants[variant],
        paddings[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string
  subtitle?: string
  action?: ReactNode
}

function CardHeader({ title, subtitle, action, className, ...props }: CardHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between mb-4', className)} {...props}>
      <div>
        <h3 className="text-xl font-semibold text-neutral-800">{title}</h3>
        {subtitle && (
          <p className="text-neutral-500 mt-1">{subtitle}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

function CardContent({ className, children, ...props }: CardContentProps) {
  return (
    <div className={cn('', className)} {...props}>
      {children}
    </div>
  )
}

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

function CardFooter({ className, children, ...props }: CardFooterProps) {
  return (
    <div
      className={cn('mt-4 pt-4 border-t border-neutral-100 flex items-center gap-3', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export { Card, CardHeader, CardContent, CardFooter }
export type { CardProps, CardHeaderProps, CardContentProps, CardFooterProps }
