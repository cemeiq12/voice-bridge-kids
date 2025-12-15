'use client'

import { useState, useEffect } from 'react'
import { Button, Card, Badge, Progress } from '@/components/ui'
import { PhonemeAnimation } from '@/components/PhonemeAnimation'
import { usePhonemeGuides } from '@/hooks/usePhonemeGuides'
import { useElevenLabsTTS } from '@/hooks/useElevenLabsTTS'
import { cn } from '@/lib/utils'
import { PhonemeGuide } from '@/types'

export default function GuidesPage() {
  const { guides, loading, error, updateProgress } = usePhonemeGuides()
  const { speakWithFallback, isPlaying, isLoading: isTTSLoading } = useElevenLabsTTS()
  const [selectedPhoneme, setSelectedPhoneme] = useState<PhonemeGuide | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all')

  // Set initial selected phoneme when guides load
  useEffect(() => {
    if (guides.length > 0 && !selectedPhoneme) {
      setSelectedPhoneme(guides[0])
    }
  }, [guides, selectedPhoneme])

  const playPhoneme = async (word?: string) => {
    setIsAnimating(true)
    const textToSpeak = word || selectedPhoneme?.examples[0] || ''

    await speakWithFallback(textToSpeak, {
      stability: 0.5,
      similarityBoost: 0.75,
    })

    setTimeout(() => setIsAnimating(false), 2000)
  }

  const handlePractice = async (phonemeId: string) => {
    // Simulate practice and update progress
    const currentProgress = guides.find((g) => g.id === phonemeId)?.progress || 0
    const newProgress = Math.min(currentProgress + 5, 100)

    try {
      await updateProgress(phonemeId, newProgress, newProgress)
    } catch (err) {
      console.error('Failed to update progress:', err)
    }
  }

  // Filter guides
  const filteredGuides = guides.filter((guide) => {
    if (filterCategory !== 'all' && guide.category !== filterCategory) return false
    if (filterDifficulty !== 'all' && guide.difficulty !== filterDifficulty) return false
    return true
  })

  const categories = Array.from(new Set(guides.map((g) => g.category)))

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="bg-error-50 border-error-200">
          <p className="text-error-700">Error loading guides: {error}</p>
        </Card>
      </div>
    )
  }

  if (!selectedPhoneme) return null

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-accent-400 to-accent-600 rounded-xl flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          </div>
          <h1 className="font-display text-3xl font-bold text-neutral-900">
            Visual Guides
          </h1>
        </div>
        <p className="text-neutral-600">
          Learn correct tongue and lip placement for challenging sounds.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Category
          </label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Difficulty
          </label>
          <select
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value)}
            className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Levels</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Phoneme List */}
        <div className="lg:col-span-1">
          <Card>
            <h2 className="font-semibold text-lg text-neutral-800 mb-4">
              Select a Sound ({filteredGuides.length})
            </h2>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredGuides.map((guide) => (
                <button
                  key={guide.id}
                  onClick={() => setSelectedPhoneme(guide)}
                  className={cn(
                    'w-full p-4 rounded-xl text-left transition-all duration-200',
                    selectedPhoneme.id === guide.id
                      ? 'bg-primary-100 border-2 border-primary-500'
                      : 'bg-neutral-50 border-2 border-transparent hover:border-neutral-200'
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg',
                          selectedPhoneme.id === guide.id
                            ? 'bg-primary-500 text-white'
                            : 'bg-neutral-200 text-neutral-700'
                        )}
                      >
                        {guide.phoneme}
                      </div>
                      <div>
                        <p className="font-medium text-neutral-800">{guide.name}</p>
                        <p className="text-sm text-neutral-500">{guide.category}</p>
                      </div>
                    </div>
                    <Badge
                      size="sm"
                      variant={
                        guide.difficulty === 'easy'
                          ? 'success'
                          : guide.difficulty === 'medium'
                          ? 'warning'
                          : 'error'
                      }
                    >
                      {guide.difficulty}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <Progress value={guide.progress || 0} size="sm" />
                    <p className="text-xs text-neutral-500">
                      {guide.progress || 0}% mastery
                      {guide.practiceCount > 0 && ` • ${guide.practiceCount} practices`}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Visual Animation */}
          <Card padding="lg">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-display text-2xl font-bold text-neutral-900">
                  {selectedPhoneme.name}
                </h2>
                <p className="text-neutral-600">{selectedPhoneme.description}</p>
              </div>
              <Button onClick={() => playPhoneme()} disabled={isPlaying || isTTSLoading}>
                <svg
                  className={cn('w-5 h-5 mr-2', isAnimating && 'animate-pulse')}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                  />
                </svg>
                {isTTSLoading ? 'Loading...' : isPlaying ? 'Playing...' : 'Hear Sound'}
              </Button>
            </div>

            {/* Enhanced Animation Component */}
            <PhonemeAnimation
              phonemeId={selectedPhoneme.id}
              isAnimating={isAnimating}
            />

            <p className="text-center text-sm text-neutral-500 mt-4">
              Interactive animation showing {selectedPhoneme.phoneme} sound formation
            </p>

            {/* Placement Details */}
            <div className="grid sm:grid-cols-3 gap-4 mt-6">
              <div className="bg-neutral-50 rounded-xl p-4">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mb-3">
                  <span className="text-xl">👅</span>
                </div>
                <h4 className="font-semibold text-neutral-800 mb-1">Tongue</h4>
                <p className="text-sm text-neutral-600">
                  {selectedPhoneme.tonguePosition}
                </p>
              </div>
              <div className="bg-neutral-50 rounded-xl p-4">
                <div className="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center mb-3">
                  <span className="text-xl">👄</span>
                </div>
                <h4 className="font-semibold text-neutral-800 mb-1">Lips</h4>
                <p className="text-sm text-neutral-600">
                  {selectedPhoneme.lipPosition}
                </p>
              </div>
              <div className="bg-neutral-50 rounded-xl p-4">
                <div className="w-10 h-10 bg-accent-100 rounded-lg flex items-center justify-center mb-3">
                  <span className="text-xl">💨</span>
                </div>
                <h4 className="font-semibold text-neutral-800 mb-1">Airflow</h4>
                <p className="text-sm text-neutral-600">
                  {selectedPhoneme.airflow}
                </p>
              </div>
            </div>
          </Card>

          {/* Practice Examples */}
          <Card>
            <h3 className="font-semibold text-lg text-neutral-800 mb-4">
              Practice Words
            </h3>
            <div className="flex flex-wrap gap-3">
              {selectedPhoneme.examples.map((word) => (
                <button
                  key={word}
                  onClick={() => {
                    setIsAnimating(true)
                    speakWithFallback(word, { stability: 0.5, similarityBoost: 0.75 })
                    setTimeout(() => setIsAnimating(false), 2000)
                  }}
                  disabled={isPlaying || isTTSLoading}
                  className="px-4 py-2 bg-neutral-50 rounded-xl hover:bg-primary-50 hover:text-primary-700 transition-colors font-medium text-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {word}
                  <svg
                    className="inline-block w-4 h-4 ml-2 opacity-50"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                    />
                  </svg>
                </button>
              ))}
            </div>
          </Card>

          {/* Tips and Common Mistakes */}
          <div className="grid sm:grid-cols-2 gap-6">
            <Card className="bg-gradient-to-br from-success-500/10 to-primary-500/10">
              <h3 className="font-semibold text-lg text-neutral-800 mb-4 flex items-center gap-2">
                <span className="text-xl">💡</span> Tips for Success
              </h3>
              <ul className="space-y-2">
                {selectedPhoneme.tips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-neutral-700">
                    <svg
                      className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5"
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
                    {tip}
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="bg-gradient-to-br from-error-500/10 to-warning-500/10">
              <h3 className="font-semibold text-lg text-neutral-800 mb-4 flex items-center gap-2">
                <span className="text-xl">⚠️</span> Common Mistakes
              </h3>
              <ul className="space-y-2">
                {selectedPhoneme.commonMistakes.map((mistake, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-neutral-700">
                    <svg
                      className="w-5 h-5 text-error-500 flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                    {mistake}
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* Practice CTA */}
          <Card className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-xl mb-1">
                  Ready to practice the {selectedPhoneme.phoneme} sound?
                </h3>
                <p className="text-white/80">
                  Practice with real-time feedback in Therapy Mode.
                </p>
              </div>
              <Button
                variant="outline"
                className="bg-white text-primary-600 border-white hover:bg-white/90"
                onClick={async () => {
                  await handlePractice(selectedPhoneme.id)
                  window.location.href = '/therapy'
                }}
              >
                Start Practice
                <svg
                  className="w-5 h-5 ml-2"
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
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
