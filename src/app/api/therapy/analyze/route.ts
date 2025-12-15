import { NextRequest, NextResponse } from 'next/server';
import { analyzeSpeech } from '@/lib/vertexai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { targetText, transcribedText, audioData, audience, persona } = body;

    if (!targetText) {
      return NextResponse.json(
        { success: false, error: 'Target text is required' },
        { status: 400 }
      );
    }

    // If no transcribed text, return a helpful response
    if (!transcribedText || transcribedText.trim() === '') {
      return NextResponse.json({
        success: true,
        data: {
          transcribedText: '',
          targetText,
          accuracy: 0,
          clarityScore: 0,
          wordAnalysis: [],
          phonemeIssues: [],
          overallScore: 0,
          recommendations: [
            'We couldn\'t detect any speech. Please try again.',
            'Make sure your microphone is working properly.',
            'Try speaking louder and clearer.',
          ],
          emotion: 'neutral',
        },
      });
    }

    const analysis = await analyzeSpeech({
      targetText,
      transcribedText,
      audioBase64: audioData, // Optional audio for multimodal analysis
      audience: audience as 'adult' | 'child',
      persona
    });

    return NextResponse.json({
      success: true,
      data: analysis,
    });
  } catch (error: any) {
    console.error('Speech analysis error detailed:', {
      message: error.message,
      stack: error.stack,
      cause: error.cause,
      apiKeyConfigured: !!process.env.GOOGLE_VERTEX_AI_API_KEY,
      model: process.env.GOOGLE_GEMINI_MODEL
    });
    return NextResponse.json(
      { success: false, error: 'Failed to analyze speech: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
