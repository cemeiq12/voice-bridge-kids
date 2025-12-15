import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      return NextResponse.json(
        { success: false, error: 'Please verify your email before logging in' },
        { status: 403 }
      )
    }

    // Return user data
    return NextResponse.json({
      success: true,
      message: 'Login successful',
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        isEmailVerified: user.isEmailVerified,
        disabilityProfile: {
          type: user.disabilityType,
          severity: user.disabilitySeverity,
          triggerWords: JSON.parse(user.triggerWords),
          description: user.disabilityDescription,
        },
        settings: {
          voiceId: user.voiceId,
          speed: user.speed,
          fontMode: user.fontMode,
          textSize: user.textSize,
          highContrast: user.highContrast,
          reducedMotion: user.reducedMotion,
        },
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, error: 'An error occurred during login' },
      { status: 500 }
    )
  }
}
