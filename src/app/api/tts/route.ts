import { NextRequest, NextResponse } from 'next/server';
import { textToSpeech, VOICE_PRESETS } from '@/lib/elevenlabs';

export async function POST(request: NextRequest) {
  try {
    const { text, voiceId, stability, similarityBoost } = await request.json();

    if (!text) {
      return NextResponse.json(
        { success: false, error: 'Text is required' },
        { status: 400 }
      );
    }

    // Get the actual voice ID from preset or use provided ID
    const actualVoiceId = voiceId && VOICE_PRESETS[voiceId as keyof typeof VOICE_PRESETS]
      ? VOICE_PRESETS[voiceId as keyof typeof VOICE_PRESETS]
      : voiceId;

    // Generate speech
    const audioBuffer = await textToSpeech({
      text,
      voiceId: actualVoiceId,
      stability: stability || 0.5,
      similarityBoost: similarityBoost || 0.75,
    });

    // Return audio as base64 for easier frontend handling
    const base64Audio = audioBuffer.toString('base64');

    return NextResponse.json({
      success: true,
      data: {
        audio: base64Audio,
        contentType: 'audio/mpeg',
      },
    });
  } catch (error) {
    console.error('TTS API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate speech' },
      { status: 500 }
    );
  }
}
