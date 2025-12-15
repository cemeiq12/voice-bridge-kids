import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Levenshtein distance for comparing transcribed vs target text
export function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length
  const n = str2.length
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0))

  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j - 1] + 1,
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1
        )
      }
    }
  }
  return dp[m][n]
}

// Calculate word accuracy percentage
export function calculateAccuracy(transcribed: string, target: string): number {
  const transcribedWords = transcribed.toLowerCase().trim().split(/\s+/)
  const targetWords = target.toLowerCase().trim().split(/\s+/)

  let correct = 0
  const maxLen = Math.max(transcribedWords.length, targetWords.length)

  for (let i = 0; i < maxLen; i++) {
    if (transcribedWords[i] === targetWords[i]) {
      correct++
    }
  }

  return maxLen > 0 ? (correct / maxLen) * 100 : 0
}

// Compare words and return detailed feedback
export function compareWords(transcribed: string, target: string): {
  word: string
  status: 'correct' | 'incorrect' | 'missing' | 'extra'
  transcribedWord?: string
}[] {
  const transcribedWords = transcribed.toLowerCase().trim().split(/\s+/).filter(Boolean)
  const targetWords = target.toLowerCase().trim().split(/\s+/).filter(Boolean)

  const result: {
    word: string
    status: 'correct' | 'incorrect' | 'missing' | 'extra'
    transcribedWord?: string
  }[] = []

  for (let i = 0; i < Math.max(transcribedWords.length, targetWords.length); i++) {
    if (i < targetWords.length && i < transcribedWords.length) {
      if (targetWords[i] === transcribedWords[i]) {
        result.push({ word: targetWords[i], status: 'correct' })
      } else {
        result.push({
          word: targetWords[i],
          status: 'incorrect',
          transcribedWord: transcribedWords[i]
        })
      }
    } else if (i >= transcribedWords.length) {
      result.push({ word: targetWords[i], status: 'missing' })
    } else {
      result.push({ word: transcribedWords[i], status: 'extra' })
    }
  }

  return result
}

// Format time duration
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Format date for display
export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

// Debounce function
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}
