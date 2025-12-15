import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, name, email } = body

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Validate at least one field to update
    if (!name && !email) {
      return NextResponse.json(
        { success: false, error: 'At least one field (name or email) must be provided' },
        { status: 400 }
      )
    }

    // Build update data object
    const updateData: any = {}

    if (name) {
      updateData.name = name
    }

    if (email) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { success: false, error: 'Invalid email format' },
          { status: 400 }
        )
      }

      // Check if email is already in use by another user
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      })

      if (existingUser && existingUser.id !== userId) {
        return NextResponse.json(
          { success: false, error: 'Email is already in use' },
          { status: 409 }
        )
      }

      updateData.email = email.toLowerCase()
    }

    // Update user profile
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
      message: 'Profile updated successfully',
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
    console.error('Profile update error:', error)

    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'An error occurred while updating profile' },
      { status: 500 }
    )
  }
}
