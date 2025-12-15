import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Fetch today's sessions for the user
    const todaySessions = await prisma.therapySession.findMany({
      where: {
        userId: userId,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
      select: {
        duration: true,
        accuracy: true,
        clarityScore: true,
        overallScore: true,
        targetText: true,
      },
    });

    // Calculate stats
    const sessionsToday = todaySessions.length;
    const totalSpeakingTime = todaySessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    const wordsPracticed = todaySessions.reduce((sum, s) => {
      return sum + (s.targetText?.split(' ').length || 0);
    }, 0);

    // Calculate averages
    let avgAccuracy = 0;
    let avgClarityScore = 0;
    let avgOverallScore = 0;

    if (sessionsToday > 0) {
      avgAccuracy = Math.round(
        todaySessions.reduce((sum, s) => sum + (s.accuracy || 0), 0) / sessionsToday
      );
      avgClarityScore = Math.round(
        todaySessions.reduce((sum, s) => sum + (s.clarityScore || 0), 0) / sessionsToday
      );
      avgOverallScore = Math.round(
        todaySessions.reduce((sum, s) => sum + (s.overallScore || 0), 0) / sessionsToday
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        sessionsToday,
        totalSpeakingTime,
        wordsPracticed,
        avgAccuracy,
        avgClarityScore,
        avgOverallScore,
      },
    });
  } catch (error) {
    console.error('Failed to fetch therapy stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
