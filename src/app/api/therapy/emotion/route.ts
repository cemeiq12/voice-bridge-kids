import { NextRequest, NextResponse } from 'next/server';
import { analyzeEmotionFromAudio } from '@/lib/vertexai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { audioBase64, mimeType } = body;

    if (!audioBase64) {
      return NextResponse.json(
        { success: false, error: 'Audio data is required' },
        { status: 400 }
      );
    }

    const emotionResult = await analyzeEmotionFromAudio(
      audioBase64,
      mimeType || 'audio/webm'
    );

    return NextResponse.json({
      success: true,
      data: emotionResult,
    });
  } catch (error) {
    console.error('Emotion analysis error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to analyze emotion from audio' },
      { status: 500 }
    );
  }
}
