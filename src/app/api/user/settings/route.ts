import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, voiceId, speed, fontMode, textSize, highContrast, reducedMotion } = body

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Build update data object
    const updateData: any = {}

    if (voiceId !== undefined) {
      updateData.voiceId = voiceId
    }

    if (speed !== undefined) {
      if (typeof speed !== 'number' || speed < 0.5 || speed > 1.5) {
        return NextResponse.json(
          { success: false, error: 'Speed must be a number between 0.5 and 1.5' },
          { status: 400 }
        )
      }
      updateData.speed = speed
    }

    if (fontMode !== undefined) {
      const validFontModes = ['default', 'dyslexic', 'hyperlegible']
      if (!validFontModes.includes(fontMode)) {
        return NextResponse.json(
          { success: false, error: 'Invalid font mode' },
          { status: 400 }
        )
      }
      updateData.fontMode = fontMode
    }

    if (textSize !== undefined) {
      const validTextSizes = ['normal', 'large', 'extra-large']
      if (!validTextSizes.includes(textSize)) {
        return NextResponse.json(
          { success: false, error: 'Invalid text size' },
          { status: 400 }
        )
      }
      updateData.textSize = textSize
    }

    if (highContrast !== undefined) {
      if (typeof highContrast !== 'boolean') {
        return NextResponse.json(
          { success: false, error: 'High contrast must be a boolean' },
          { status: 400 }
        )
      }
      updateData.highContrast = highContrast
    }

    if (reducedMotion !== undefined) {
      if (typeof reducedMotion !== 'boolean') {
        return NextResponse.json(
          { success: false, error: 'Reduced motion must be a boolean' },
          { status: 400 }
        )
      }
      updateData.reducedMotion = reducedMotion
    }

    // Update settings
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
    const triggerWords = JSON.parse(updatedUser.triggerWords || '[]')

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        avatar: updatedUser.avatar,
        disabilityProfile: {
          type: updatedUser.disabilityType,
          severity: updatedUser.disabilitySeverity,
          triggerWords,
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
    console.error('Settings update error:', error)

    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'An error occurred while updating settings' },
      { status: 500 }
    )
  }
}
