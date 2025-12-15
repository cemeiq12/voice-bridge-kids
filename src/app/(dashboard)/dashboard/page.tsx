'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Button, Card, Badge, Progress, CircularMetric, EmotionBadge } from '@/components/ui'
import { useUser } from '@/context/UserContext'

const DISCLAIMER_KEY = 'voicebridge-disclaimer-accepted'

function DisclaimerPopup({ onAccept }: { onAccept: () => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slideIn">
      <div className="max-w-sm bg-white rounded-2xl shadow-2xl border border-warning-200 overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-warning-100 to-warning-50 px-5 py-3 flex items-center gap-3">
          <div className="w-10 h-10 bg-warning-200 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h4 className="font-semibold text-warning-800">Important Notice</h4>
        </div>

        {/* Content */}
        <div className="px-5 py-4">
          <p className="text-sm text-neutral-600 leading-relaxed">
            VoiceBridge AI is designed to <span className="font-medium text-neutral-800">enhance and support</span> your speech therapy journey, not replace professional sessions with a certified therapist.
          </p>
        </div>

        {/* Action */}
        <div className="px-5 pb-4">
          <button
            onClick={onAccept}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-warning-500 to-warning-600 hover:from-warning-600 hover:to-warning-700 text-white font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            I Understand
          </button>
        </div>
      </div>
    </div>
  )
}

interface DashboardData {
  user: {
    id: string
    name: string
    email: string
    disabilityType: string
    memberSince: string
    communicationStyle: string
    learningStyle: string
    interests: string[]
  }
  improvementMetrics: {
    language: number
    empathy: number
    clarity: number
  }
  emotionData: Array<{
    emotion: string
    time: string
    percentage: number
    count: number
  }>
  recentSessions: Array<{
    id: string
    date: string
    title: string
    score: number
    duration: string
    emotion: 'happy' | 'calm' | 'confident' | 'frustrated' | 'neutral'
    category: string
    difficulty: string
  }>
  weeklyStats: {
    sessions: number
    sessionsTarget: number
    sessionsChange: number
    practiceTime: number
    practiceTimeFormatted: string
    practiceTimeTarget: number
    practiceTimeChange: number
    avgScore: number
    avgScoreChange: number
  }
  recommendations: Array<{
    id: string
    title: string
    description: string
    type: 'phoneme' | 'practice' | 'bridge' | 'guide'
    priority: 'high' | 'medium' | 'low'
    link: string
    completed: boolean
  }>
  totalStats: {
    totalSessions: number
    totalPracticeTime: number
    totalPracticeTimeFormatted: string
    overallAvgScore: number
  }
}

function DashboardSkeleton() {
  return (
    <div className="p-6 lg:p-8 animate-pulse">
      {/* Warning Banner Skeleton */}
      <div className="mb-6 bg-neutral-100 rounded-xl h-14" />

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Content Skeleton */}
        <div className="flex-1 space-y-6">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="h-6 w-20 bg-neutral-200 rounded-full" />
                <div className="h-6 w-24 bg-neutral-200 rounded-full" />
              </div>
              <div className="h-8 w-64 bg-neutral-200 rounded" />
            </div>
            <div className="flex gap-3">
              <div className="h-10 w-20 bg-neutral-200 rounded-lg" />
              <div className="h-10 w-28 bg-neutral-200 rounded-lg" />
            </div>
          </div>

          {/* Metrics Skeleton */}
          <div className="glass-card-solid p-6">
            <div className="h-6 w-48 bg-neutral-200 rounded mb-2" />
            <div className="h-4 w-80 bg-neutral-200 rounded mb-6" />
            <div className="flex flex-wrap justify-center gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="w-28 h-28 bg-neutral-200 rounded-full" />
                  <div className="h-4 w-20 bg-neutral-200 rounded mt-3" />
                </div>
              ))}
            </div>
          </div>

          {/* Emotions Skeleton */}
          <div className="glass-card-solid p-6">
            <div className="h-6 w-32 bg-neutral-200 rounded mb-6" />
            <div className="grid sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-neutral-50 rounded-xl">
                  <div className="w-10 h-10 bg-neutral-200 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-24 bg-neutral-200 rounded" />
                    <div className="h-2 w-full bg-neutral-200 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sessions Skeleton */}
          <div className="glass-card-solid p-6">
            <div className="h-6 w-36 bg-neutral-200 rounded mb-4" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-neutral-200 rounded-full" />
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-neutral-200 rounded" />
                      <div className="h-3 w-24 bg-neutral-200 rounded" />
                    </div>
                  </div>
                  <div className="h-6 w-12 bg-neutral-200 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Skeleton */}
        <div className="w-full lg:w-80 space-y-6">
          <div className="glass-card-solid p-6 h-80 bg-neutral-100" />
          <div className="glass-card-solid p-6 h-48 bg-neutral-100" />
          <div className="glass-card-solid p-6 h-52 bg-neutral-100" />
        </div>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-12">
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center">
        <svg className="w-10 h-10 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12h3l3-6 4 12 3-6h5" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 0 1-9 9 9 9 0 0 1-9-9" opacity="0.5" />
        </svg>
      </div>
      <h3 className="font-display text-xl font-bold text-neutral-800 mb-2">
        Start Your First Session
      </h3>
      <p className="text-neutral-500 mb-6 max-w-md mx-auto">
        Begin your speech therapy journey. Complete your first practice session to see your progress here.
      </p>
      <Link href="/therapy">
        <Button size="lg" className="px-8">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Start Practice Session
        </Button>
      </Link>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useUser()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set())
  const [showDisclaimer, setShowDisclaimer] = useState(false)

  // Check if disclaimer was previously accepted
  useEffect(() => {
    const accepted = localStorage.getItem(DISCLAIMER_KEY)
    if (!accepted) {
      // Show disclaimer after a short delay for better UX
      const timer = setTimeout(() => setShowDisclaimer(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleAcceptDisclaimer = () => {
    localStorage.setItem(DISCLAIMER_KEY, 'true')
    setShowDisclaimer(false)
  }

  const fetchDashboardData = useCallback(async () => {
    if (!user?._id) return

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/dashboard?userId=${user._id}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch dashboard data')
      }

      setDashboardData(data.data)
    } catch (err) {
      console.error('Dashboard fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load dashboard')
    } finally {
      setIsLoading(false)
    }
  }, [user?._id])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const handleTaskToggle = (taskId: string) => {
    setCompletedTasks(prev => {
      const newSet = new Set(prev)
      if (newSet.has(taskId)) {
        newSet.delete(taskId)
      } else {
        newSet.add(taskId)
      }
      return newSet
    })
  }

  if (isLoading) {
    return <DashboardSkeleton />
  }

  if (error) {
    return (
      <div className="p-6 lg:p-8">
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="font-semibold text-lg text-neutral-800 mb-2">Failed to Load Dashboard</h3>
          <p className="text-neutral-500 mb-4">{error}</p>
          <Button onClick={fetchDashboardData}>Try Again</Button>
        </div>
      </div>
    )
  }

  const hasNoSessions = !dashboardData?.recentSessions?.length

  return (
    <div className="p-6 lg:p-8">
      {/* Disclaimer Popup */}
      {showDisclaimer && <DisclaimerPopup onAccept={handleAcceptDisclaimer} />}

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Content */}
        <div className="flex-1 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="tag tag-primary">{dashboardData?.user?.disabilityType || 'speech therapy'}</span>
                <span className="tag tag-secondary">speech therapy</span>
              </div>
              <h1 className="font-display text-2xl font-bold text-neutral-900">
                {dashboardData?.user?.name?.split(' ')[0] || user?.name?.split(' ')[0] || 'User'}&apos;s Practice Dashboard
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/progress">
                <Button variant="outline" size="sm">View Progress</Button>
              </Link>
              <Link href="/therapy">
                <Button size="sm">Start Session</Button>
              </Link>
            </div>
          </div>

          {hasNoSessions ? (
            <div className="glass-card-solid p-8">
              <EmptyState />
            </div>
          ) : (
            <>
              {/* Points of Improvement */}
              <div className="glass-card-solid p-6">
                <h2 className="font-semibold text-lg text-neutral-800 mb-2">Points of Improvement</h2>
                <p className="text-sm text-neutral-500 mb-6">
                  Here are things we recommend you to improve on based on your previous conversations.
                </p>

                <div className="flex flex-wrap justify-center gap-8">
                  <CircularMetric
                    value={dashboardData?.improvementMetrics?.language || 0}
                    label="Language"
                    sublabel="based on how understandable your conversations were."
                    color="primary"
                  />
                  <CircularMetric
                    value={dashboardData?.improvementMetrics?.empathy || 0}
                    label="Engagement"
                    sublabel="based on how consistent your practice has been."
                    color="secondary"
                  />
                  <CircularMetric
                    value={dashboardData?.improvementMetrics?.clarity || 0}
                    label="Clarity"
                    sublabel="based on how clear your pronunciation was."
                    color="accent"
                  />
                </div>
              </div>

              {/* Emotions Scale */}
              {dashboardData?.emotionData && dashboardData.emotionData.length > 0 && (
                <div className="glass-card-solid p-6">
                  <h2 className="font-semibold text-lg text-neutral-800 mb-6">Emotions Scale</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {dashboardData.emotionData.map((item, index) => (
                      <div key={index} className="flex items-center gap-4 p-4 bg-neutral-50 rounded-xl">
                        <EmotionBadge
                          emotion={item.emotion as 'happy' | 'calm' | 'confident' | 'frustrated' | 'neutral'}
                          size="lg"
                          showLabel={false}
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-neutral-800 capitalize">{item.emotion}</span>
                            <span className="text-sm text-neutral-500">{item.time} | {item.percentage}%</span>
                          </div>
                          <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full progress-bar-fill-gradient transition-all duration-500"
                              style={{ width: `${item.percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Sessions */}
              <div className="glass-card-solid p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-lg text-neutral-800">Recent Sessions</h2>
                  <Link href="/progress" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                    View all
                  </Link>
                </div>
                <div className="space-y-3">
                  {dashboardData?.recentSessions?.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl hover:bg-neutral-100 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <EmotionBadge emotion={session.emotion} showLabel={false} />
                        <div>
                          <p className="font-medium text-neutral-800">{session.title}</p>
                          <p className="text-sm text-neutral-500">{session.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className={`font-bold ${session.score >= 80 ? 'text-green-600' :
                              session.score >= 60 ? 'text-yellow-600' : 'text-neutral-800'
                            }`}>{session.score}%</p>
                          <p className="text-xs text-neutral-400">{session.duration}</p>
                        </div>
                        <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="w-full lg:w-80 space-y-6">
          {/* User Profile Card */}
          <div className="glass-card-solid p-6 text-center">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary-200 to-secondary-200 flex items-center justify-center overflow-hidden">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center text-white text-3xl font-bold">
                {dashboardData?.user?.name?.charAt(0).toUpperCase() || user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
            </div>
            <h3 className="font-display text-xl font-bold text-neutral-800 mb-3">
              {dashboardData?.user?.name || user?.name || 'User'}
            </h3>
            <div className="space-y-2 text-left">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-6 h-6 bg-primary-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12h3l3-6 4 12 3-6h5" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 0 1-9 9 9 9 0 0 1-9-9" opacity="0.5" />
                  </svg>
                </div>
                <span className="text-neutral-500">communication style</span>
              </div>
              <p className="font-medium text-neutral-800 ml-8">
                {dashboardData?.user?.communicationStyle || 'Emerging Voice'}
              </p>

              <div className="flex items-center gap-2 text-sm mt-3">
                <div className="w-6 h-6 bg-secondary-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <span className="text-neutral-500">learning style</span>
              </div>
              <p className="font-medium text-neutral-800 ml-8">
                {dashboardData?.user?.learningStyle || 'Explorer'}
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-neutral-100">
              <p className="text-sm text-neutral-500 mb-2">Focus Areas</p>
              <div className="flex flex-wrap justify-center gap-2">
                {(dashboardData?.user?.interests || ['speech practice', 'communication', 'self-improvement']).map((interest, idx) => (
                  <span key={idx} className="tag">{interest}</span>
                ))}
              </div>
            </div>

            {dashboardData?.totalStats && dashboardData.totalStats.totalSessions > 0 && (
              <div className="mt-4 pt-4 border-t border-neutral-100">
                <div className="flex justify-center gap-6 text-center">
                  <div>
                    <p className="text-2xl font-bold text-primary-600">{dashboardData.totalStats.totalSessions}</p>
                    <p className="text-xs text-neutral-500">Sessions</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-secondary-600">{dashboardData.totalStats.totalPracticeTimeFormatted}</p>
                    <p className="text-xs text-neutral-500">Practice Time</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Next Steps */}
          <div className="glass-card-solid p-6">
            <h3 className="font-semibold text-lg text-neutral-800 mb-2">Next Steps</h3>
            <p className="text-sm text-neutral-500 mb-4">
              Actionable tasks based on your sessions
            </p>
            <div className="space-y-3">
              {(dashboardData?.recommendations || [
                { id: 'therapy', title: 'Start a therapy session', description: 'Begin practicing', type: 'practice', priority: 'high', link: '/therapy', completed: false },
                { id: 'bridge', title: 'Try Bridge Mode', description: 'Real conversation', type: 'bridge', priority: 'medium', link: '/bridge', completed: false },
              ]).map((rec) => (
                <div
                  key={rec.id}
                  className={`flex items-center justify-between p-3 rounded-xl transition-colors ${rec.priority === 'high' ? 'recommendation-card' : 'bg-neutral-50'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={completedTasks.has(rec.id)}
                      onChange={() => handleTaskToggle(rec.id)}
                      className="w-5 h-5 rounded border-neutral-200 cursor-pointer"
                      style={{ accentColor: '#A1BC98' }}
                    />
                    <div>
                      <p className={`font-medium text-sm ${completedTasks.has(rec.id) ? 'text-neutral-400 line-through' : 'text-neutral-800'}`}>
                        {rec.title}
                      </p>
                      <span className={`text-xs ${rec.priority === 'high' ? 'text-primary-600' : 'text-neutral-500'}`}>
                        {rec.description}
                      </span>
                    </div>
                  </div>
                  <Link href={rec.link}>
                    <button className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${rec.priority === 'high'
                        ? 'bg-primary-100 text-primary-600 hover:bg-primary-200'
                        : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                      }`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </button>
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="glass-card-solid p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg text-neutral-800">This Week</h3>
              {dashboardData?.weeklyStats?.sessionsChange !== undefined && (
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${dashboardData.weeklyStats.sessionsChange >= 0
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                  }`}>
                  {dashboardData.weeklyStats.sessionsChange >= 0 ? '+' : ''}
                  {dashboardData.weeklyStats.sessionsChange} vs last week
                </span>
              )}
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-neutral-600">Sessions</span>
                  <span className="font-bold text-neutral-800">
                    {dashboardData?.weeklyStats?.sessions || 0}
                    <span className="text-neutral-400 font-normal">/{dashboardData?.weeklyStats?.sessionsTarget || 7}</span>
                  </span>
                </div>
                <Progress
                  value={((dashboardData?.weeklyStats?.sessions || 0) / (dashboardData?.weeklyStats?.sessionsTarget || 7)) * 100}
                  variant="gradient"
                  size="sm"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-neutral-600">Practice Time</span>
                  <span className="font-bold text-neutral-800">
                    {dashboardData?.weeklyStats?.practiceTimeFormatted || '0 min'}
                  </span>
                </div>
                <Progress
                  value={Math.min(100, ((dashboardData?.weeklyStats?.practiceTime || 0) / (dashboardData?.weeklyStats?.practiceTimeTarget || 3600)) * 100)}
                  size="sm"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-neutral-600">Avg Score</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-neutral-800">{dashboardData?.weeklyStats?.avgScore || 0}%</span>
                    {dashboardData?.weeklyStats?.avgScoreChange !== undefined && dashboardData.weeklyStats.avgScoreChange !== 0 && (
                      <span className={`text-xs ${dashboardData.weeklyStats.avgScoreChange > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                        {dashboardData.weeklyStats.avgScoreChange > 0 ? '↑' : '↓'}
                        {Math.abs(dashboardData.weeklyStats.avgScoreChange)}%
                      </span>
                    )}
                  </div>
                </div>
                <Progress
                  value={dashboardData?.weeklyStats?.avgScore || 0}
                  variant={
                    (dashboardData?.weeklyStats?.avgScore || 0) >= 80 ? 'success' :
                      (dashboardData?.weeklyStats?.avgScore || 0) >= 60 ? 'primary' : 'warning'
                  }
                  size="sm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
