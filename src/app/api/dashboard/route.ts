import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

interface EmotionStat {
  emotion: string;
  count: number;
  totalDuration: number;
}

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

    // Get user profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        disabilityType: true,
        disabilitySeverity: true,
        triggerWords: true,
        disabilityDescription: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get date ranges
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfLastWeek = new Date(startOfWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

    // Fetch all sessions for the user
    const allSessions = await prisma.therapySession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch this week's sessions
    const weekSessions = await prisma.therapySession.findMany({
      where: {
        userId,
        createdAt: {
          gte: startOfWeek,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch last week's sessions for comparison
    const lastWeekSessions = await prisma.therapySession.findMany({
      where: {
        userId,
        createdAt: {
          gte: startOfLastWeek,
          lt: startOfWeek,
        },
      },
    });

    // Fetch recent sessions (last 5)
    const recentSessions = await prisma.therapySession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        targetText: true,
        transcribedText: true,
        duration: true,
        accuracy: true,
        clarityScore: true,
        overallScore: true,
        emotion: true,
        category: true,
        difficulty: true,
        createdAt: true,
        phonemeIssues: true,
        recommendations: true,
      },
    });

    // Calculate improvement metrics (based on all sessions)
    let languageScore = 0;
    let empathyScore = 0;
    let clarityScore = 0;

    if (allSessions.length > 0) {
      // Language score based on average accuracy
      languageScore = Math.round(
        allSessions.reduce((sum, s) => sum + s.accuracy, 0) / allSessions.length
      );

      // Empathy/engagement score based on session frequency and duration
      const avgSessionsPerWeek = allSessions.length / Math.max(1, Math.ceil(
        (now.getTime() - new Date(allSessions[allSessions.length - 1].createdAt).getTime()) / (7 * 24 * 60 * 60 * 1000)
      ));
      const avgDuration = allSessions.reduce((sum, s) => sum + s.duration, 0) / allSessions.length;
      // Score based on consistency (target: 5 sessions/week, 10 min avg)
      empathyScore = Math.min(100, Math.round(
        (avgSessionsPerWeek / 5 * 50) + (avgDuration / 600 * 50)
      ));

      // Clarity score from average clarity scores
      clarityScore = Math.round(
        allSessions.reduce((sum, s) => sum + s.clarityScore, 0) / allSessions.length
      );
    }

    // Calculate emotion distribution from all sessions
    const emotionCounts: Record<string, EmotionStat> = {};
    allSessions.forEach((session) => {
      const emotion = session.emotion || 'neutral';
      if (!emotionCounts[emotion]) {
        emotionCounts[emotion] = { emotion, count: 0, totalDuration: 0 };
      }
      emotionCounts[emotion].count += 1;
      emotionCounts[emotion].totalDuration += session.duration;
    });

    const totalDuration = allSessions.reduce((sum, s) => sum + s.duration, 0);
    const emotionData = Object.values(emotionCounts)
      .map((stat) => ({
        emotion: stat.emotion,
        time: formatDuration(stat.totalDuration),
        percentage: totalDuration > 0 
          ? Math.round((stat.totalDuration / totalDuration) * 100) 
          : 0,
        count: stat.count,
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 4); // Top 4 emotions

    // Calculate weekly stats
    const weekSessionCount = weekSessions.length;
    const weekPracticeTime = weekSessions.reduce((sum, s) => sum + s.duration, 0);
    const weekAvgScore = weekSessions.length > 0
      ? Math.round(weekSessions.reduce((sum, s) => sum + s.overallScore, 0) / weekSessions.length)
      : 0;

    // Calculate week-over-week changes
    const lastWeekSessionCount = lastWeekSessions.length;
    const lastWeekPracticeTime = lastWeekSessions.reduce((sum, s) => sum + s.duration, 0);
    const lastWeekAvgScore = lastWeekSessions.length > 0
      ? Math.round(lastWeekSessions.reduce((sum, s) => sum + s.overallScore, 0) / lastWeekSessions.length)
      : 0;

    // Collect all phoneme issues from recent sessions
    const phonemeIssuesMap: Record<string, number> = {};
    recentSessions.forEach((session) => {
      try {
        const issues = JSON.parse(session.phonemeIssues || '[]');
        issues.forEach((issue: { phoneme: string; frequency: number }) => {
          phonemeIssuesMap[issue.phoneme] = (phonemeIssuesMap[issue.phoneme] || 0) + (issue.frequency || 1);
        });
      } catch {
        // Ignore parse errors
      }
    });

    // Get top struggle phonemes
    const strugglePhonemes = Object.entries(phonemeIssuesMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([phoneme]) => phoneme);

    // Generate recommendations based on data
    const recommendations = generateRecommendations({
      strugglePhonemes,
      weekSessionCount,
      avgScore: weekAvgScore,
      recentEmotions: emotionData.map(e => e.emotion),
    });

    // Determine user characteristics based on activity
    const communicationStyle = determineCommunicationStyle(allSessions.length, avgDuration(allSessions));
    const learningStyle = determineLearningStyle(allSessions);

    // Parse user interests from trigger words or description
    const interests = parseInterests(user.triggerWords, user.disabilityDescription);

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          disabilityType: user.disabilityType,
          memberSince: user.createdAt,
          communicationStyle,
          learningStyle,
          interests,
        },
        improvementMetrics: {
          language: languageScore,
          empathy: empathyScore,
          clarity: clarityScore,
        },
        emotionData,
        recentSessions: recentSessions.map((session) => ({
          id: session.id,
          date: formatSessionDate(session.createdAt),
          title: generateSessionTitle(session.category, session.createdAt),
          score: Math.round(session.overallScore),
          duration: formatDuration(session.duration),
          emotion: mapEmotion(session.emotion),
          category: session.category,
          difficulty: session.difficulty,
        })),
        weeklyStats: {
          sessions: weekSessionCount,
          sessionsTarget: 7,
          sessionsChange: weekSessionCount - lastWeekSessionCount,
          practiceTime: weekPracticeTime,
          practiceTimeFormatted: formatDuration(weekPracticeTime),
          practiceTimeTarget: 60 * 60, // 60 minutes target
          practiceTimeChange: weekPracticeTime - lastWeekPracticeTime,
          avgScore: weekAvgScore,
          avgScoreChange: weekAvgScore - lastWeekAvgScore,
        },
        recommendations,
        totalStats: {
          totalSessions: allSessions.length,
          totalPracticeTime: totalDuration,
          totalPracticeTimeFormatted: formatDuration(totalDuration),
          overallAvgScore: allSessions.length > 0
            ? Math.round(allSessions.reduce((sum, s) => sum + s.overallScore, 0) / allSessions.length)
            : 0,
        },
      },
    });
  } catch (error) {
    console.error('Dashboard data error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}

// Helper functions
function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} sec`;
  } else if (seconds < 3600) {
    const mins = Math.round(seconds / 60);
    return `${mins} min`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.round((seconds % 3600) / 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
}

function formatSessionDate(date: Date): string {
  const now = new Date();
  const sessionDate = new Date(date);
  const diffDays = Math.floor((now.getTime() - sessionDate.getTime()) / (24 * 60 * 60 * 1000));

  const timeStr = sessionDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  if (diffDays === 0) {
    return `Today, ${timeStr}`;
  } else if (diffDays === 1) {
    return `Yesterday, ${timeStr}`;
  } else if (diffDays < 7) {
    const dayName = sessionDate.toLocaleDateString('en-US', { weekday: 'long' });
    return `${dayName}, ${timeStr}`;
  } else {
    return sessionDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }
}

function generateSessionTitle(category: string, date: Date): string {
  const sessionDate = new Date(date);
  const hour = sessionDate.getHours();

  let timeOfDay = 'Practice';
  if (hour >= 5 && hour < 12) {
    timeOfDay = 'Morning';
  } else if (hour >= 12 && hour < 17) {
    timeOfDay = 'Afternoon';
  } else if (hour >= 17 && hour < 21) {
    timeOfDay = 'Evening';
  } else {
    timeOfDay = 'Night';
  }

  if (category && category !== 'General') {
    return `${timeOfDay} ${category} Practice`;
  }
  return `${timeOfDay} Practice`;
}

function mapEmotion(emotion: string): 'happy' | 'calm' | 'confident' | 'frustrated' | 'neutral' {
  const emotionMap: Record<string, 'happy' | 'calm' | 'confident' | 'frustrated' | 'neutral'> = {
    happy: 'happy',
    joyful: 'happy',
    excited: 'happy',
    calm: 'calm',
    relaxed: 'calm',
    peaceful: 'calm',
    confident: 'confident',
    proud: 'confident',
    determined: 'confident',
    frustrated: 'frustrated',
    angry: 'frustrated',
    annoyed: 'frustrated',
    sad: 'frustrated',
    neutral: 'neutral',
  };

  return emotionMap[emotion?.toLowerCase()] || 'neutral';
}

function avgDuration(sessions: { duration: number }[]): number {
  if (sessions.length === 0) return 0;
  return sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length;
}

function determineCommunicationStyle(sessionCount: number, avgDuration: number): string {
  if (sessionCount >= 20 && avgDuration >= 300) {
    return 'Expressive Communicator';
  } else if (sessionCount >= 10) {
    return 'Active Initiator';
  } else if (avgDuration >= 600) {
    return 'Deep Conversationalist';
  } else if (sessionCount >= 5) {
    return 'Growing Speaker';
  }
  return 'Emerging Voice';
}

function determineLearningStyle(sessions: { difficulty: string; category: string }[]): string {
  if (sessions.length === 0) return 'Explorer';

  const difficultyCount = sessions.reduce(
    (acc, s) => {
      acc[s.difficulty] = (acc[s.difficulty] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const categoryCount = sessions.reduce(
    (acc, s) => {
      acc[s.category] = (acc[s.category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const uniqueCategories = Object.keys(categoryCount).length;

  if (difficultyCount['hard'] >= sessions.length * 0.4) {
    return 'Challenge Seeker';
  } else if (uniqueCategories >= 4) {
    return 'Versatile Learner';
  } else if (difficultyCount['easy'] >= sessions.length * 0.6) {
    return 'Steady Builder';
  } else {
    return 'Collaborative Learner';
  }
}

function parseInterests(triggerWords: string | null, description: string | null): string[] {
  const defaultInterests = ['speech practice', 'communication', 'self-improvement'];

  try {
    const triggers = JSON.parse(triggerWords || '[]');
    if (Array.isArray(triggers) && triggers.length > 0) {
      return triggers.slice(0, 3);
    }
  } catch {
    // Use defaults
  }

  if (description) {
    // Extract keywords from description
    const words = description.toLowerCase().split(/\s+/);
    const interestKeywords = ['reading', 'writing', 'music', 'sports', 'art', 'coding', 'games', 'cooking', 'travel'];
    const found = words.filter(w => interestKeywords.includes(w));
    if (found.length > 0) {
      return found.slice(0, 3);
    }
  }

  return defaultInterests;
}

interface RecommendationInput {
  strugglePhonemes: string[];
  weekSessionCount: number;
  avgScore: number;
  recentEmotions: string[];
}

interface Recommendation {
  id: string;
  title: string;
  description: string;
  type: 'phoneme' | 'practice' | 'bridge' | 'guide';
  priority: 'high' | 'medium' | 'low';
  link: string;
  completed: boolean;
}

function generateRecommendations(input: RecommendationInput): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // Phoneme practice recommendations
  if (input.strugglePhonemes.length > 0) {
    recommendations.push({
      id: 'phoneme-practice',
      title: `Practice '${input.strugglePhonemes[0]}' sounds`,
      description: '5 min targeted exercise',
      type: 'phoneme',
      priority: 'high',
      link: '/guides',
      completed: false,
    });
  }

  // Session frequency recommendation
  if (input.weekSessionCount < 3) {
    recommendations.push({
      id: 'more-sessions',
      title: 'Complete a therapy session',
      description: `${3 - input.weekSessionCount} more sessions this week`,
      type: 'practice',
      priority: 'high',
      link: '/therapy',
      completed: false,
    });
  }

  // Bridge mode recommendation
  recommendations.push({
    id: 'bridge-mode',
    title: 'Try Bridge Mode',
    description: 'Real conversation practice',
    type: 'bridge',
    priority: 'medium',
    link: '/bridge',
    completed: false,
  });

  // Score improvement recommendation
  if (input.avgScore < 70) {
    recommendations.push({
      id: 'improve-score',
      title: 'Review pronunciation guides',
      description: 'Focus on fundamentals',
      type: 'guide',
      priority: 'medium',
      link: '/guides',
      completed: false,
    });
  }

  return recommendations.slice(0, 3);
}

