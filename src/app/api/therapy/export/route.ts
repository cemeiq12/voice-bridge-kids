import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const format = searchParams.get('format') || 'json'; // json, csv

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Fetch all sessions for the user
    const sessions = await prisma.therapySession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
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

    if (format === 'csv') {
      // Generate CSV
      const headers = [
        'Date',
        'Target Text',
        'Transcribed Text',
        'Duration (seconds)',
        'Accuracy (%)',
        'Clarity Score (%)',
        'Overall Score (%)',
        'Difficulty',
        'Category',
        'Emotion',
      ];

      const rows = sessions.map((session) => [
        new Date(session.createdAt).toISOString(),
        `"${session.targetText.replace(/"/g, '""')}"`,
        `"${session.transcribedText.replace(/"/g, '""')}"`,
        session.duration,
        session.accuracy.toFixed(1),
        session.clarityScore.toFixed(1),
        session.overallScore.toFixed(1),
        session.difficulty,
        session.category,
        session.emotion,
      ]);

      const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="voicebridge-sessions-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    // Return JSON by default
    const exportData = {
      exportedAt: new Date().toISOString(),
      summary: {
        totalSessions: stats._count,
        totalPracticeTime: stats._sum.duration || 0,
        averageAccuracy: Math.round((stats._avg.accuracy || 0) * 100) / 100,
        averageClarityScore: Math.round((stats._avg.clarityScore || 0) * 100) / 100,
        averageOverallScore: Math.round((stats._avg.overallScore || 0) * 100) / 100,
      },
      sessions: sessions.map((session) => ({
        id: session.id,
        date: session.createdAt,
        targetText: session.targetText,
        transcribedText: session.transcribedText,
        duration: session.duration,
        accuracy: session.accuracy,
        clarityScore: session.clarityScore,
        overallScore: session.overallScore,
        difficulty: session.difficulty,
        category: session.category,
        emotion: session.emotion,
        wordAnalysis: JSON.parse(session.wordAnalysis),
        phonemeIssues: JSON.parse(session.phonemeIssues),
        recommendations: JSON.parse(session.recommendations),
      })),
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="voicebridge-sessions-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to export data' },
      { status: 500 }
    );
  }
}
