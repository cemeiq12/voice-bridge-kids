'use client'

import { useState, useEffect } from 'react'
import { Button, Card, Badge, Progress } from '@/components/ui'
import { cn } from '@/lib/utils'
import { useUser } from '@/context/UserContext'
import { ErrorBoundary } from '@/components/ErrorBoundary'

interface SessionData {
  id: string
  targetText: string
  transcribedText: string
  duration: number
  accuracy: number
  clarityScore: number
  overallScore: number
  difficulty: string
  category: string
  emotion: string
  createdAt: string
  wordAnalysis: Array<{ word: string; status: string }>
  phonemeIssues: Array<{ phoneme: string; word: string }>
}

interface DailyStats {
  date: string
  sessions: number
  avgScore: number
  totalMinutes: number
}

interface PhonemeStats {
  phoneme: string
  count: number
  avgScore: number
}

export default function ProgressPage() {
  const { user } = useUser()
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week')
  const [isLoading, setIsLoading] = useState(true)
  const [sessions, setSessions] = useState<SessionData[]>([])
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalDuration: 0,
    averageAccuracy: 0,
    averageClarityScore: 0,
    averageOverallScore: 0,
  })
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([])
  const [phonemeStats, setPhonemeStats] = useState<PhonemeStats[]>([])
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    const loadProgress = async () => {
      if (!user?._id) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)

      try {
        const response = await fetch(`/api/therapy/session?userId=${user._id}&limit=100`)
        const data = await response.json()

        if (data.success) {
          setSessions(data.data.sessions || [])
          setStats(data.data.stats || {
            totalSessions: 0,
            totalDuration: 0,
            averageAccuracy: 0,
            averageClarityScore: 0,
            averageOverallScore: 0,
          })

          // Process daily stats
          const sessionsData = data.data.sessions || []
          const daily = processWeeklyData(sessionsData, timeRange)
          setDailyStats(daily)

          // Process phoneme stats
          const phonemes = processPhonemeData(sessionsData)
          setPhonemeStats(phonemes)

          // Calculate streak
          const currentStreak = calculateStreak(sessionsData)
          setStreak(currentStreak)
        }
      } catch (error) {
        console.error('Failed to load progress:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadProgress()
  }, [user?._id, timeRange])

  const processWeeklyData = (sessions: SessionData[], range: string): DailyStats[] => {
    const now = new Date()
    const result: DailyStats[] = []

    if (range === 'week') {
      // Show last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now)
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]

        const daySessions = sessions.filter(s => {
          const sessionDate = new Date(s.createdAt).toISOString().split('T')[0]
          return sessionDate === dateStr
        })

        const avgScore = daySessions.length > 0
          ? Math.round(daySessions.reduce((acc, s) => acc + (s.overallScore || 0), 0) / daySessions.length)
          : 0

        const totalMinutes = Math.round(daySessions.reduce((acc, s) => acc + s.duration, 0) / 60)

        result.push({
          date: date.toLocaleDateString('en-US', { weekday: 'short' }),
          sessions: daySessions.length,
          avgScore,
          totalMinutes,
        })
      }
    } else if (range === 'month') {
      // Show last 4 weeks
      for (let i = 3; i >= 0; i--) {
        const weekEnd = new Date(now)
        weekEnd.setDate(weekEnd.getDate() - (i * 7))
        const weekStart = new Date(weekEnd)
        weekStart.setDate(weekStart.getDate() - 6)

        const weekSessions = sessions.filter(s => {
          const sessionDate = new Date(s.createdAt)
          return sessionDate >= weekStart && sessionDate <= weekEnd
        })

        const avgScore = weekSessions.length > 0
          ? Math.round(weekSessions.reduce((acc, s) => acc + (s.overallScore || 0), 0) / weekSessions.length)
          : 0

        const totalMinutes = Math.round(weekSessions.reduce((acc, s) => acc + s.duration, 0) / 60)

        const weekLabel = i === 0 ? 'This Week' : `${i + 1} weeks ago`

        result.push({
          date: weekLabel,
          sessions: weekSessions.length,
          avgScore,
          totalMinutes,
        })
      }
    } else {
      // All time - show last 12 months
      for (let i = 11; i >= 0; i--) {
        const monthDate = new Date(now)
        monthDate.setMonth(monthDate.getMonth() - i)
        const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
        const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)

        const monthSessions = sessions.filter(s => {
          const sessionDate = new Date(s.createdAt)
          return sessionDate >= monthStart && sessionDate <= monthEnd
        })

        const avgScore = monthSessions.length > 0
          ? Math.round(monthSessions.reduce((acc, s) => acc + (s.overallScore || 0), 0) / monthSessions.length)
          : 0

        const totalMinutes = Math.round(monthSessions.reduce((acc, s) => acc + s.duration, 0) / 60)

        result.push({
          date: monthDate.toLocaleDateString('en-US', { month: 'short' }),
          sessions: monthSessions.length,
          avgScore,
          totalMinutes,
        })
      }
    }

    return result
  }

  const processPhonemeData = (sessions: SessionData[]): PhonemeStats[] => {
    const phonemeMap = new Map<string, { count: number; totalScore: number }>()

    sessions.forEach(session => {
      if (session.phonemeIssues && Array.isArray(session.phonemeIssues)) {
        session.phonemeIssues.forEach((issue) => {
          const existing = phonemeMap.get(issue.phoneme) || { count: 0, totalScore: 0 }
          phonemeMap.set(issue.phoneme, {
            count: existing.count + 1,
            totalScore: existing.totalScore + session.overallScore,
          })
        })
      }
    })

    return Array.from(phonemeMap.entries())
      .map(([phoneme, data]) => ({
        phoneme,
        count: data.count,
        avgScore: Math.round(data.totalScore / data.count),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
  }

  const calculateStreak = (sessions: SessionData[]): number => {
    if (sessions.length === 0) return 0

    const dates = new Set(
      sessions.map(s => new Date(s.createdAt).toISOString().split('T')[0])
    )

    let streak = 0
    const today = new Date()

    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today)
      checkDate.setDate(checkDate.getDate() - i)
      const dateStr = checkDate.toISOString().split('T')[0]

      if (dates.has(dateStr)) {
        streak++
      } else if (i > 0) {
        break
      }
    }

    return streak
  }

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${String(secs).padStart(2, '0')}`
  }

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) {
      return `Today, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
    } else if (days === 1) {
      return `Yesterday, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    }
  }

  const maxScore = Math.max(...dailyStats.map(d => d.avgScore), 1)

  const exportData = async (format: 'json' | 'csv') => {
    if (!user?._id) return

    try {
      const response = await fetch(`/api/therapy/export?userId=${user._id}&format=${format}`)
      const blob = await response.blob()

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `voicebridge-sessions-${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  if (!user?._id) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="text-center py-12">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-neutral-800 mb-2">Track Your Progress</h2>
          <p className="text-neutral-600 mb-6">Sign in to see your practice history and progress charts.</p>
          <Button variant="primary" onClick={() => window.location.href = '/login'}>
            Sign In
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-neutral-900 mb-2">
              Your Progress
            </h1>
            <p className="text-neutral-600">
              Track your improvement and celebrate your achievements.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-2 bg-neutral-100 rounded-xl p-1">
              {(['week', 'month', 'all'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                    timeRange === range
                      ? 'bg-white shadow-sm text-neutral-800'
                      : 'text-neutral-600 hover:text-neutral-800'
                  )}
                >
                  {range === 'week' ? 'This Week' : range === 'month' ? 'This Month' : 'All Time'}
                </button>
              ))}
            </div>
            {/* Export Buttons */}
            {sessions.length > 0 && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportData('csv')}
                  aria-label="Export as CSV"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportData('json')}
                  aria-label="Export as JSON"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  JSON
                </Button>
              </div>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <>
            {/* Stats Overview */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <p className="text-4xl font-bold text-neutral-900">{stats.totalSessions}</p>
                <p className="text-neutral-600">Total Sessions</p>
              </Card>

              <Card className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-accent-400 to-accent-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-4xl font-bold text-neutral-900">{Math.round(stats.totalDuration / 60)}</p>
                <p className="text-neutral-600">Minutes Practiced</p>
              </Card>

              <Card className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-secondary-400 to-secondary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-4xl font-bold text-neutral-900">{Math.round(stats.averageOverallScore)}%</p>
                <p className="text-neutral-600">Average Score</p>
              </Card>

              <Card className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                  </svg>
                </div>
                <p className="text-4xl font-bold text-neutral-900">{streak}</p>
                <p className="text-neutral-600">Day Streak</p>
              </Card>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">
                {/* Weekly Activity Chart */}
                <Card>
                  <h2 className="font-semibold text-xl text-neutral-800 mb-6">
                    {timeRange === 'week' ? 'Weekly' : timeRange === 'month' ? 'Monthly' : 'All Time'} Activity
                  </h2>
                  {dailyStats.length > 0 && dailyStats.some(d => d.sessions > 0) ? (
                    <div className="px-2 pb-2">
                      <div className="flex items-end justify-between gap-2 mb-4" style={{ height: '192px' }}>
                        {dailyStats.map((day, i) => {
                          // Calculate bar height in pixels (container is 192px)
                          const chartHeight = 192
                          const barHeightPercent = day.avgScore > 0
                            ? (day.avgScore / maxScore) * 100
                            : day.sessions > 0
                              ? 10  // Show minimum 10% height if sessions exist but no score
                              : 0

                          const barHeightPx = Math.max((chartHeight * barHeightPercent) / 100, day.sessions > 0 ? 12 : 0)

                          return (
                            <div key={i} className="flex-1 group relative">
                              <div className="w-full h-full bg-neutral-100 rounded-lg relative flex flex-col justify-end overflow-hidden">
                                {day.sessions > 0 && (
                                  <div
                                    className="w-full bg-gradient-to-t from-primary-500 to-primary-400 rounded-lg transition-all duration-500"
                                    style={{
                                      height: `${barHeightPx}px`
                                    }}
                                  />
                                )}
                              </div>
                              {/* Tooltip */}
                              {day.sessions > 0 && (
                                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 hidden group-hover:block bg-neutral-800 text-white text-xs px-3 py-2 rounded whitespace-nowrap z-10 shadow-lg">
                                  <div className="font-semibold">{day.sessions} sessions</div>
                                  <div className="text-neutral-300">{day.avgScore > 0 ? `${day.avgScore}% avg` : 'No score data'}</div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                      <div className="flex justify-between mt-2 min-h-[60px]">
                        {dailyStats.map((day, i) => (
                          <div key={i} className="flex-1 text-center px-1">
                            <p className="text-sm font-medium text-neutral-600 mb-1">{day.date}</p>
                            <p className="text-xs text-neutral-400 mb-1">{day.sessions} sessions</p>
                            {day.sessions > 0 && (
                              <p className="text-xs text-primary-600 font-medium">{day.avgScore}%</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-neutral-500">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-accent-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                        </div>
                        <p>No sessions recorded yet.</p>
                        <p className="text-sm">Start practicing to see your progress!</p>
                      </div>
                    </div>
                  )}
                </Card>

                {/* Score Breakdown Chart */}
                <Card>
                  <h2 className="font-semibold text-xl text-neutral-800 mb-6">
                    Score Breakdown
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium text-neutral-700">Accuracy</span>
                        <span className="text-sm font-bold text-neutral-800">{Math.round(stats.averageAccuracy)}%</span>
                      </div>
                      <Progress value={stats.averageAccuracy} variant={stats.averageAccuracy >= 70 ? 'success' : 'default'} />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium text-neutral-700">Clarity</span>
                        <span className="text-sm font-bold text-neutral-800">{Math.round(stats.averageClarityScore)}%</span>
                      </div>
                      <Progress value={stats.averageClarityScore} variant={stats.averageClarityScore >= 70 ? 'success' : 'default'} />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium text-neutral-700">Overall</span>
                        <span className="text-sm font-bold text-neutral-800">{Math.round(stats.averageOverallScore)}%</span>
                      </div>
                      <Progress value={stats.averageOverallScore} variant={stats.averageOverallScore >= 70 ? 'success' : 'default'} />
                    </div>
                  </div>
                </Card>

                {/* Recent Sessions */}
                <Card>
                  <h2 className="font-semibold text-xl text-neutral-800 mb-6">
                    Recent Sessions
                  </h2>
                  {sessions.length > 0 ? (
                    <div className="space-y-4">
                      {sessions.slice(0, 5).map((session) => (
                        <div
                          key={session.id}
                          className="p-4 bg-neutral-50 rounded-xl hover:bg-neutral-100 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 mr-4">
                              <p className="font-medium text-neutral-800 line-clamp-1">
                                {session.targetText}
                              </p>
                              <p className="text-sm text-neutral-500">{formatDate(session.createdAt)}</p>
                            </div>
                            <div className="text-right">
                              <p className={cn(
                                'text-lg font-bold',
                                session.overallScore >= 90 ? 'text-success-600' :
                                session.overallScore >= 70 ? 'text-primary-600' : 'text-warning-600'
                              )}>
                                {Math.round(session.overallScore)}%
                              </p>
                              <p className="text-xs text-neutral-400">{formatDuration(session.duration)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge size="sm" variant={session.difficulty === 'easy' ? 'success' : session.difficulty === 'medium' ? 'warning' : 'error'}>
                              {session.difficulty}
                            </Badge>
                            <Badge size="sm" variant="outline">
                              {session.category}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-neutral-500">
                      <div className="w-16 h-16 bg-gradient-to-br from-accent-400 to-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                      </div>
                      <p>No sessions yet. Start practicing!</p>
                    </div>
                  )}
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Phoneme Progress */}
                <Card>
                  <h2 className="font-semibold text-xl text-neutral-800 mb-6">
                    Phoneme Focus Areas
                  </h2>
                  {phonemeStats.length > 0 ? (
                    <div className="space-y-4">
                      {phonemeStats.map((item) => (
                        <div key={item.phoneme} className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center font-bold text-primary-600">
                            {item.phoneme}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-neutral-700">
                                {item.count} occurrences
                              </span>
                              <span className="text-sm font-bold text-neutral-800">
                                {item.avgScore}%
                              </span>
                            </div>
                            <Progress
                              value={item.avgScore}
                              size="sm"
                              variant={item.avgScore >= 80 ? 'success' : 'default'}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-neutral-500">
                      <p className="text-sm">Complete more sessions to see phoneme analysis</p>
                    </div>
                  )}
                </Card>

                {/* Emotion Summary */}
                <Card>
                  <h2 className="font-semibold text-xl text-neutral-800 mb-6">
                    Mood During Practice
                  </h2>
                  {sessions.length > 0 ? (
                    <div className="space-y-3">
                      {Object.entries(
                        sessions.reduce((acc, s) => {
                          acc[s.emotion] = (acc[s.emotion] || 0) + 1
                          return acc
                        }, {} as Record<string, number>)
                      )
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 5)
                        .map(([emotion, count]) => (
                          <div key={emotion} className="flex items-center justify-between">
                            <span className="text-sm capitalize text-neutral-700">{emotion}</span>
                            <span className="text-sm font-medium text-neutral-800">{count} sessions</span>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-neutral-500">
                      <p className="text-sm">No mood data yet</p>
                    </div>
                  )}
                </Card>

                {/* Motivation Card */}
                <Card className="bg-gradient-to-br from-primary-500 to-secondary-500 text-white">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-xl mb-2">
                      {stats.totalSessions === 0 ? 'Get Started!' : streak >= 7 ? 'Amazing Streak!' : 'Keep Going!'}
                    </h3>
                    <p className="text-white/80 text-sm">
                      {stats.totalSessions === 0
                        ? 'Start your first practice session to begin tracking your progress.'
                        : streak >= 7
                        ? `You've practiced for ${streak} days in a row! Keep up the great work!`
                        : `You've completed ${stats.totalSessions} sessions. Keep practicing to improve!`}
                    </p>
                  </div>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
    </ErrorBoundary>
  )
}
