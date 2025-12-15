import { NextRequest, NextResponse } from 'next/server'
import { getPhonemeById } from '@/lib/phoneme-data'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const guide = getPhonemeById(id)

    if (!guide) {
      return NextResponse.json(
        {
          success: false,
          error: 'Phoneme guide not found',
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: guide,
    })
  } catch (error) {
    console.error('Error fetching phoneme guide:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch phoneme guide',
      },
      { status: 500 }
    )
  }
}
