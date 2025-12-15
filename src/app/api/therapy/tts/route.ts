import { NextRequest, NextResponse } from 'next/server';
import { textToSpeech, VOICE_PRESETS } from '@/lib/elevenlabs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, voiceId, speed } = body;

    if (!text) {
      return NextResponse.json(
        { success: false, error: 'Text is required' },
        { status: 400 }
      );
    }

    // Use therapy voice preset by default
    const selectedVoice = voiceId || VOICE_PRESETS.THERAPY;

    const audioBuffer = await textToSpeech({
      text,
      voiceId: selectedVoice,
      stability: 0.7,
      similarityBoost: 0.8,
      style: 0,
      useSpeakerBoost: true,
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
    console.error('Therapy TTS error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate speech' },
      { status: 500 }
    );
  }
}
