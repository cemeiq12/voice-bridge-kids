import { useState, useEffect } from 'react'
import { PhonemeGuide, PhonemeProgress } from '@/types'

export function usePhonemeGuides() {
  const [guides, setGuides] = useState<PhonemeGuide[]>([])
  const [progress, setProgress] = useState<Map<string, PhonemeProgress>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch all guides
  useEffect(() => {
    async function fetchGuides() {
      try {
        setLoading(true)
        const response = await fetch('/api/guides')
        const result = await response.json()

        if (result.success) {
          setGuides(result.data)
        } else {
          setError(result.error || 'Failed to fetch guides')
        }
      } catch (err) {
        setError('Failed to fetch guides')
        console.error('Error fetching guides:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchGuides()
  }, [])

  // Fetch user progress
  useEffect(() => {
    async function fetchProgress() {
      try {
        const response = await fetch('/api/guides/progress?userId=demo-user')
        const result = await response.json()

        if (result.success && result.data) {
          const progressMap = new Map<string, PhonemeProgress>()
          result.data.forEach((p: PhonemeProgress) => {
            progressMap.set(p.phonemeId, p)
          })
          setProgress(progressMap)
        }
      } catch (err) {
        console.error('Error fetching progress:', err)
      }
    }

    fetchProgress()
  }, [])

  // Update progress for a phoneme
  const updateProgress = async (
    phonemeId: string,
    progressValue: number,
    accuracy?: number
  ) => {
    try {
      const response = await fetch('/api/guides/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'demo-user',
          phonemeId,
          progress: progressValue,
          accuracy,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setProgress((prev) => {
          const newProgress = new Map(prev)
          newProgress.set(phonemeId, result.data)
          return newProgress
        })
        return result.data
      } else {
        throw new Error(result.error || 'Failed to update progress')
      }
    } catch (err) {
      console.error('Error updating progress:', err)
      throw err
    }
  }

  // Get progress for a specific phoneme
  const getProgress = (phonemeId: string): PhonemeProgress | undefined => {
    return progress.get(phonemeId)
  }

  // Get guides with their progress
  const guidesWithProgress = guides.map((guide) => ({
    ...guide,
    progress: progress.get(guide.id)?.progress || 0,
    practiceCount: progress.get(guide.id)?.practiceCount || 0,
    lastPracticedAt: progress.get(guide.id)?.lastPracticedAt,
  }))

  return {
    guides: guidesWithProgress,
    loading,
    error,
    updateProgress,
    getProgress,
  }
}
