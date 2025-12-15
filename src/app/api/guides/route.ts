import { NextRequest, NextResponse } from 'next/server'
import { phonemeGuides } from '@/lib/phoneme-data'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const difficulty = searchParams.get('difficulty')

    let filteredGuides = [...phonemeGuides]

    if (category) {
      filteredGuides = filteredGuides.filter(
        (guide) => guide.category.toLowerCase() === category.toLowerCase()
      )
    }

    if (difficulty) {
      filteredGuides = filteredGuides.filter(
        (guide) => guide.difficulty === difficulty
      )
    }

    return NextResponse.json({
      success: true,
      data: filteredGuides,
      count: filteredGuides.length,
    })
  } catch (error) {
    console.error('Error fetching phoneme guides:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch phoneme guides',
      },
      { status: 500 }
    )
  }
}
