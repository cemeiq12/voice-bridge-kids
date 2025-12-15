'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button, Input, Card } from '@/components/ui'
import type { DisabilityProfile } from '@/types'

const disabilityTypes: { value: DisabilityProfile['type']; label: string; description: string }[] = [
  {
    value: 'dyspraxia',
    label: 'Dyspraxia',
    description: 'Difficulty coordinating mouth movements',
  },
  {
    value: 'apraxia',
    label: 'Apraxia',
    description: 'Challenges in planning speech movements',
  },
  {
    value: 'stuttering',
    label: 'Stuttering',
    description: 'Speech flow disruptions and blocks',
  },
  {
    value: 'als',
    label: 'ALS / Motor Neuron',
    description: 'Progressive speech muscle weakness',
  },
  {
    value: 'other',
    label: 'Other',
    description: 'Other speech-motor conditions',
  },
]

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    disabilityType: '' as DisabilityProfile['type'] | '',
    severity: 5,
  })
  const [error, setError] = useState('')

  const handleNext = () => {
    setError('')

    if (step === 1) {
      if (!formData.name || !formData.email || !formData.password) {
        setError('Please fill in all fields')
        return
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match')
        return
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters')
        return
      }
    }

    if (step === 2) {
      if (!formData.disabilityType) {
        setError('Please select a condition type')
        return
      }
    }

    setStep(step + 1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          disabilityType: formData.disabilityType,
          severity: formData.severity,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Registration failed. Please try again.')
        return
      }

      // Store email in session storage for verification page
      sessionStorage.setItem('verification-email', formData.email)

      // Redirect to email verification page
      router.push('/verify-email')
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center px-4 py-12">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-200 rounded-full blur-3xl opacity-30" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary-200 rounded-full blur-3xl opacity-30" />
      </div>

      <div className="w-full max-w-lg relative">
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

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${i === step
                  ? 'w-8 bg-primary-500'
                  : i < step
                    ? 'w-2 bg-primary-300'
                    : 'w-2 bg-neutral-200'
                }`}
            />
          ))}
        </div>

        <Card padding="lg" className="shadow-soft">
          {/* Step 1: Account Info */}
          {step === 1 && (
            <>
              <div className="text-center mb-8">
                <h1 className="font-display text-2xl font-bold text-neutral-900 mb-2">
                  Create your account
                </h1>
                <p className="text-neutral-600">
                  Start your journey to clearer communication
                </p>
              </div>

              <form className="space-y-5">
                {error && (
                  <div className="bg-error-500/10 text-error-600 px-4 py-3 rounded-xl text-sm">
                    {error}
                  </div>
                )}

                <Input
                  label="Full Name"
                  type="text"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  leftIcon={
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  }
                />

                <Input
                  label="Email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  leftIcon={
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                      />
                    </svg>
                  }
                />

                <Input
                  label="Password"
                  type="password"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  hint="At least 6 characters"
                  leftIcon={
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  }
                />

                <Input
                  label="Confirm Password"
                  type="password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, confirmPassword: e.target.value })
                  }
                  leftIcon={
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                  }
                />

                <Button
                  type="button"
                  onClick={handleNext}
                  fullWidth
                  size="lg"
                >
                  Continue
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </Button>
              </form>
            </>
          )}

          {/* Step 2: Condition Type */}
          {step === 2 && (
            <>
              <div className="text-center mb-8">
                <h1 className="font-display text-2xl font-bold text-neutral-900 mb-2">
                  Tell us about yourself
                </h1>
                <p className="text-neutral-600">
                  This helps us personalize your experience
                </p>
              </div>

              <div className="space-y-6">
                {error && (
                  <div className="bg-error-500/10 text-error-600 px-4 py-3 rounded-xl text-sm">
                    {error}
                  </div>
                )}

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-neutral-700">
                    Select your condition
                  </label>
                  <div className="grid gap-3">
                    {disabilityTypes.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, disabilityType: type.value })
                        }
                        className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${formData.disabilityType === type.value
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-neutral-200 hover:border-neutral-300'
                          }`}
                      >
                        <div className="font-semibold text-neutral-800">
                          {type.label}
                        </div>
                        <div className="text-sm text-neutral-500">
                          {type.description}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="flex-1"
                  >
                    Continue
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Step 3: Severity & Finish */}
          {step === 3 && (
            <>
              <div className="text-center mb-8">
                <h1 className="font-display text-2xl font-bold text-neutral-900 mb-2">
                  Almost there!
                </h1>
                <p className="text-neutral-600">
                  Help us understand your speech challenges
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-error-500/10 text-error-600 px-4 py-3 rounded-xl text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-4">
                    How would you rate the severity of your speech challenges?
                  </label>
                  <div className="space-y-4">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={formData.severity}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          severity: parseInt(e.target.value),
                        })
                      }
                      className="w-full h-3 bg-neutral-200 rounded-full appearance-none cursor-pointer accent-primary-500"
                    />
                    <div className="flex justify-between text-sm text-neutral-500">
                      <span>Mild (1)</span>
                      <span className="font-semibold text-primary-600 text-lg">
                        {formData.severity}
                      </span>
                      <span>Severe (10)</span>
                    </div>
                  </div>
                </div>

                <div className="bg-primary-50 p-4 rounded-xl">
                  <p className="text-sm text-neutral-700">
                    <strong>Note:</strong> This information helps us customize
                    practice prompts and provide more relevant feedback. You can
                    always update this in your settings.
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(2)}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    isLoading={isLoading}
                    className="flex-1"
                  >
                    Create Account
                  </Button>
                </div>
              </form>
            </>
          )}

          <div className="mt-8 text-center">
            <p className="text-neutral-600">
              Already have an account?{' '}
              <Link
                href="/login"
                className="text-primary-600 hover:text-primary-700 font-semibold"
              >
                Sign in
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
