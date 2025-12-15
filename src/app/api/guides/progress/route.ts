import { NextRequest, NextResponse } from 'next/server'
import { PhonemeProgress } from '@/types'

export const dynamic = 'force-dynamic'

// In-memory storage for demo purposes
// In production, this would use a database
const progressStore = new Map<string, Map<string, PhonemeProgress>>()

// Helper to get user progress map
function getUserProgressMap(userId: string): Map<string, PhonemeProgress> {
  if (!progressStore.has(userId)) {
    progressStore.set(userId, new Map())
  }
  return progressStore.get(userId)!
}

// GET - Fetch user's progress for all phonemes or a specific one
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || 'demo-user'
    const phonemeId = searchParams.get('phonemeId')

    const userProgress = getUserProgressMap(userId)

    if (phonemeId) {
      const progress = userProgress.get(phonemeId)
      if (!progress) {
        return NextResponse.json({
          success: true,
          data: null,
        })
      }

      return NextResponse.json({
        success: true,
        data: progress,
      })
    }

    // Return all progress for user
    const allProgress = Array.from(userProgress.values())
    return NextResponse.json({
      success: true,
      data: allProgress,
      count: allProgress.length,
    })
  } catch (error) {
    console.error('Error fetching phoneme progress:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch phoneme progress',
      },
      { status: 500 }
    )
  }
}

// POST - Update user's progress for a phoneme
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId = 'demo-user',
      phonemeId,
      progress,
      accuracy,
    } = body

    if (!phonemeId || progress === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: 'phonemeId and progress are required',
        },
        { status: 400 }
      )
    }

    if (progress < 0 || progress > 100) {
      return NextResponse.json(
        {
          success: false,
          error: 'Progress must be between 0 and 100',
        },
        { status: 400 }
      )
    }

    const userProgress = getUserProgressMap(userId)
    const existingProgress = userProgress.get(phonemeId)

    const now = new Date().toISOString()

    const updatedProgress: PhonemeProgress = {
      userId,
      phonemeId,
      progress,
      practiceCount: (existingProgress?.practiceCount || 0) + 1,
      lastPracticedAt: now,
      accuracyHistory: [
        ...(existingProgress?.accuracyHistory || []),
        accuracy || progress,
      ].slice(-10), // Keep last 10 accuracy scores
      createdAt: existingProgress?.createdAt || now,
      updatedAt: now,
    }

    userProgress.set(phonemeId, updatedProgress)

    return NextResponse.json({
      success: true,
      data: updatedProgress,
      message: 'Progress updated successfully',
    })
  } catch (error) {
    console.error('Error updating phoneme progress:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update phoneme progress',
      },
      { status: 500 }
    )
  }
}

// DELETE - Reset progress for a phoneme or all phonemes
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || 'demo-user'
    const phonemeId = searchParams.get('phonemeId')

    const userProgress = getUserProgressMap(userId)

    if (phonemeId) {
      userProgress.delete(phonemeId)
      return NextResponse.json({
        success: true,
        message: `Progress reset for phoneme ${phonemeId}`,
      })
    }

    // Clear all progress for user
    userProgress.clear()
    return NextResponse.json({
      success: true,
      message: 'All progress reset',
    })
  } catch (error) {
    console.error('Error resetting phoneme progress:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to reset phoneme progress',
      },
      { status: 500 }
    )
  }
}
