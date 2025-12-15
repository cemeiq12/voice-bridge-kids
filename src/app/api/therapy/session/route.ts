import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Save a therapy session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      targetText,
      transcribedText,
      duration,
      accuracy,
      clarityScore,
      overallScore,
      wordAnalysis,
      phonemeIssues,
      recommendations,
      difficulty,
      category,
      emotion,
    } = body;

    if (!userId || !targetText) {
      return NextResponse.json(
        { success: false, error: 'User ID and target text are required' },
        { status: 400 }
      );
    }

    const session = await prisma.therapySession.create({
      data: {
        userId,
        targetText,
        transcribedText: transcribedText || '',
        duration: duration || 0,
        accuracy: accuracy || 0,
        clarityScore: clarityScore || 0,
        overallScore: overallScore || 0,
        wordAnalysis: JSON.stringify(wordAnalysis || []),
        phonemeIssues: JSON.stringify(phonemeIssues || []),
        recommendations: JSON.stringify(recommendations || []),
        difficulty: difficulty || 'easy',
        category: category || 'General',
        emotion: emotion || 'neutral',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: session.id,
        createdAt: session.createdAt,
      },
    });
  } catch (error) {
    console.error('Save session error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save session' },
      { status: 500 }
    );
  }
}

// Get user's therapy sessions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    const sessions = await prisma.therapySession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.therapySession.count({
      where: { userId },
    });

    // Calculate aggregate stats
    const stats = await prisma.therapySession.aggregate({
      where: { userId },
      _avg: {
        accuracy: true,
        clarityScore: true,
        overallScore: true,
      },
      _sum: {
        duration: true,
      },
      _count: true,
    });

    return NextResponse.json({
      success: true,
      data: {
        sessions: sessions.map((s) => ({
          ...s,
          wordAnalysis: JSON.parse(s.wordAnalysis),
          phonemeIssues: JSON.parse(s.phonemeIssues),
          recommendations: JSON.parse(s.recommendations),
        })),
        total,
        stats: {
          totalSessions: stats._count,
          totalDuration: stats._sum.duration || 0,
          averageAccuracy: Math.round((stats._avg.accuracy || 0) * 100) / 100,
          averageClarityScore: Math.round((stats._avg.clarityScore || 0) * 100) / 100,
          averageOverallScore: Math.round((stats._avg.overallScore || 0) * 100) / 100,
        },
      },
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get sessions' },
      { status: 500 }
    );
  }
}
