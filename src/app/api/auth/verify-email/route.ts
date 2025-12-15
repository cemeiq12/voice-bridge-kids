import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, code } = body

    // Validate required fields
    if (!email || !code) {
      return NextResponse.json(
        { success: false, error: 'Email and verification code are required' },
        { status: 400 }
      )
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if already verified
    if (user.isEmailVerified) {
      return NextResponse.json(
        { success: false, error: 'Email is already verified' },
        { status: 400 }
      )
    }

    // Check verification code
    if (user.verificationCode !== code) {
      return NextResponse.json(
        { success: false, error: 'Invalid verification code' },
        { status: 400 }
      )
    }

    // Check if code has expired
    if (user.verificationCodeExpiresAt && new Date() > user.verificationCodeExpiresAt) {
      return NextResponse.json(
        { success: false, error: 'Verification code has expired' },
        { status: 400 }
      )
    }

    // Update user as verified
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        verificationCode: null,
        verificationCodeExpiresAt: null,
      },
    })

    // Return user data for auto-login
    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        isEmailVerified: updatedUser.isEmailVerified,
        disabilityProfile: {
          type: updatedUser.disabilityType,
          severity: updatedUser.disabilitySeverity,
          triggerWords: JSON.parse(updatedUser.triggerWords),
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
  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json(
      { success: false, error: 'An error occurred during verification' },
      { status: 500 }
    )
  }
}
