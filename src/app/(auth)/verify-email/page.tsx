'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button, Card } from '@/components/ui'
import { useUser } from '@/context/UserContext'

export default function VerifyEmailPage() {
  const router = useRouter()
  const { setUserFromVerification } = useUser()
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    // Get email from session storage
    const storedEmail = sessionStorage.getItem('verification-email')
    if (storedEmail) {
      setEmail(storedEmail)
    } else {
      // No email found, redirect to register
      router.push('/register')
    }
  }, [router])

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return

    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)
    setError('')

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').slice(0, 6)
    if (!/^\d+$/.test(pastedData)) return

    const newCode = [...code]
    for (let i = 0; i < pastedData.length && i < 6; i++) {
      newCode[i] = pastedData[i]
    }
    setCode(newCode)

    // Focus the next empty input or the last one
    const nextEmptyIndex = newCode.findIndex(c => !c)
    if (nextEmptyIndex !== -1) {
      inputRefs.current[nextEmptyIndex]?.focus()
    } else {
      inputRefs.current[5]?.focus()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const verificationCode = code.join('')
    if (verificationCode.length !== 6) {
      setError('Please enter the complete 6-digit code')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          code: verificationCode,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Verification failed. Please try again.')
        return
      }

      // Success - set user and redirect
      setIsSuccess(true)

      // Store user data and redirect after a brief delay
      if (data.data) {
        setUserFromVerification({
          _id: data.data.id,
          email: data.data.email,
          name: data.data.name,
          disabilityProfile: data.data.disabilityProfile,
          settings: data.data.settings,
          createdAt: data.data.createdAt,
          updatedAt: data.data.updatedAt,
        })
      }

      // Clear session storage
      sessionStorage.removeItem('verification-email')

      // Redirect to dashboard after showing success
      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    // For now, just show a message since SMTP is not working
    // In production, this would call an API to resend the code
    alert('For development, the verification code is: 123456')
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center px-4 py-12">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-200 rounded-full blur-3xl opacity-30" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary-200 rounded-full blur-3xl opacity-30" />
        </div>

        <Card padding="lg" className="shadow-soft max-w-md w-full text-center">
          <div className="w-20 h-20 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-success-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="font-display text-2xl font-bold text-neutral-900 mb-2">
            Email Verified!
          </h1>
          <p className="text-neutral-600 mb-4">
            Your account has been successfully verified. Redirecting to dashboard...
          </p>
          <div className="flex justify-center">
            <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center px-4 py-12">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-200 rounded-full blur-3xl opacity-30" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary-200 rounded-full blur-3xl opacity-30" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center shadow-glow">
              <svg
                className="w-7 h-7 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12h3l3-6 4 12 3-6h5"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 0 1-9 9 9 9 0 0 1-9-9"
                  opacity="0.5"
                />
              </svg>
            </div>
            <span className="font-display text-2xl font-bold text-neutral-800">
              VoiceBridge
            </span>
          </Link>
        </div>

        <Card padding="lg" className="shadow-soft">
          <div className="text-center mb-8">
            {/* Email icon */}
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-primary-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h1 className="font-display text-2xl font-bold text-neutral-900 mb-2">
              Verify your email
            </h1>
            <p className="text-neutral-600">
              We sent a verification code to
            </p>
            <p className="font-semibold text-neutral-800">{email}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-error-500/10 text-error-600 px-4 py-3 rounded-xl text-sm text-center">
                {error}
              </div>
            )}

            {/* Development hint */}
            <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl text-sm text-center">
              <strong>Development Mode:</strong> Use code <span className="font-mono font-bold">123456</span>
            </div>

            {/* 6-digit code input */}
            <div className="flex justify-center gap-2">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${error
                      ? 'border-error-300 bg-error-50'
                      : digit
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                  autoFocus={index === 0}
                />
              ))}
            </div>

            <Button
              type="submit"
              fullWidth
              size="lg"
              isLoading={isLoading}
            >
              Verify Email
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-neutral-600 text-sm">
              Didn&apos;t receive the code?{' '}
              <button
                type="button"
                onClick={handleResendCode}
                className="text-primary-600 hover:text-primary-700 font-semibold"
              >
                Resend
              </button>
            </p>
          </div>

          <div className="mt-4 text-center">
            <Link
              href="/register"
              className="text-neutral-500 hover:text-neutral-700 text-sm"
            >
              &larr; Back to registration
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
