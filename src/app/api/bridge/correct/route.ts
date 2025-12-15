import { NextRequest, NextResponse } from 'next/server';
import { correctSpeech, transcribeAndCorrectSpeech } from '@/lib/vertexai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rawTranscript, audioBase64, mimeType, context } = body;

    // If audio is provided, use multimodal transcription + correction
    if (audioBase64) {
      const result = await transcribeAndCorrectSpeech(
        audioBase64,
        mimeType || 'audio/webm'
      );

      return NextResponse.json({
        success: true,
        data: result,
      });
    }

    // Otherwise, correct the provided transcript
    if (!rawTranscript) {
      return NextResponse.json(
        { success: false, error: 'Either rawTranscript or audioBase64 is required' },
        { status: 400 }
      );
    }

    const result = await correctSpeech({
      rawTranscript,
      context,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Bridge correction error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to correct speech' },
      { status: 500 }
    );
  }
}
