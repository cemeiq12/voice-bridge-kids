import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, type, severity, triggerWords, description } = body

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Build update data object
    const updateData: any = {}

    if (type !== undefined) {
      const validTypes = ['dyspraxia', 'apraxia', 'stuttering', 'als', 'parkinsons', 'other']
      if (!validTypes.includes(type)) {
        return NextResponse.json(
          { success: false, error: 'Invalid disability type' },
          { status: 400 }
        )
      }
      updateData.disabilityType = type
    }

    if (severity !== undefined) {
      if (typeof severity !== 'number' || severity < 1 || severity > 10) {
        return NextResponse.json(
          { success: false, error: 'Severity must be a number between 1 and 10' },
          { status: 400 }
        )
      }
      updateData.disabilitySeverity = severity
    }

    if (triggerWords !== undefined) {
      if (!Array.isArray(triggerWords)) {
        return NextResponse.json(
          { success: false, error: 'Trigger words must be an array' },
          { status: 400 }
        )
      }
      updateData.triggerWords = JSON.stringify(triggerWords)
    }

    if (description !== undefined) {
      updateData.disabilityDescription = description
    }

    // Update disability profile
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        disabilityType: true,
        disabilitySeverity: true,
        triggerWords: true,
        disabilityDescription: true,
        voiceId: true,
        speed: true,
        fontMode: true,
        textSize: true,
        highContrast: true,
        reducedMotion: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    // Parse JSON fields
    const parsedTriggerWords = JSON.parse(updatedUser.triggerWords || '[]')

    return NextResponse.json({
      success: true,
      message: 'Disability profile updated successfully',
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        avatar: updatedUser.avatar,
        disabilityProfile: {
          type: updatedUser.disabilityType,
          severity: updatedUser.disabilitySeverity,
          triggerWords: parsedTriggerWords,
          description: updatedUser.disabilityDescription,
        },
        settings: {
          voiceId: updatedUser.voiceId,
          speed: updatedUser.speed,
          fontMode: updatedUser.fontMode,
          textSize: updatedUser.textSize,
          highContrast: updatedUser.highContrast,
          reducedMotion: updatedUser.reducedMotion,
        },
        createdAt: updatedUser.createdAt.toISOString(),
        updatedAt: updatedUser.updatedAt.toISOString(),
      },
    })
  } catch (error: any) {
    console.error('Disability profile update error:', error)

    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'An error occurred while updating disability profile' },
      { status: 500 }
    )
  }
}
