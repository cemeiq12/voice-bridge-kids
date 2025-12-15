import { ElevenLabsClient } from 'elevenlabs';

// Lazy initialization of the ElevenLabs client
let elevenlabs: ElevenLabsClient | null = null;

function getClient(): ElevenLabsClient {
  if (!elevenlabs) {
    if (!process.env.ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY is not configured');
    }
    elevenlabs = new ElevenLabsClient({
      apiKey: process.env.ELEVENLABS_API_KEY,
    });
  }
  return elevenlabs;
}

export interface TTSOptions {
  text: string;
  voiceId?: string;
  modelId?: string;
  stability?: number;
  similarityBoost?: number;
  style?: number;
  useSpeakerBoost?: boolean;
}

/**
 * Convert text to speech using ElevenLabs API
 * @param options - Text-to-speech options
 * @returns Audio buffer
 */
export async function textToSpeech(options: TTSOptions): Promise<Buffer> {
  const {
    text,
    voiceId = process.env.ELEVENLABS_DEFAULT_VOICE_ID || '21m00Tcm4TlvDq8ikWAM',
    modelId = process.env.ELEVENLABS_MODEL_ID || 'eleven_monolingual_v1',
    stability = 0.5,
    similarityBoost = 0.75,
    style = 0,
    useSpeakerBoost = true,
  } = options;

  try {
    const client = getClient();
    const audio = await client.generate({
      voice: voiceId,
      text: text,
      model_id: modelId,
      voice_settings: {
        stability: stability,
        similarity_boost: similarityBoost,
        style: style,
        use_speaker_boost: useSpeakerBoost,
      },
    });

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of audio) {
      chunks.push(chunk);
    }

    return Buffer.concat(chunks);
  } catch (error) {
    console.error('ElevenLabs TTS Error:', error);
    throw error;
  }
}

/**
 * Get available voices from ElevenLabs
 * @returns List of available voices
 */
export async function getVoices() {
  try {
    const client = getClient();
    const voices = await client.voices.getAll();
    return voices.voices;
  } catch (error) {
    console.error('ElevenLabs Get Voices Error:', error);
    throw error;
  }
}

/**
 * Stream text-to-speech audio
 * @param options - Text-to-speech options
 * @returns Audio stream
 */
export async function textToSpeechStream(options: TTSOptions) {
  const {
    text,
    voiceId = process.env.ELEVENLABS_DEFAULT_VOICE_ID || '21m00Tcm4TlvDq8ikWAM',
    modelId = process.env.ELEVENLABS_MODEL_ID || 'eleven_monolingual_v1',
    stability = 0.5,
    similarityBoost = 0.75,
    style = 0,
    useSpeakerBoost = true,
  } = options;

  try {
    const client = getClient();
    const audio = await client.generate({
      voice: voiceId,
      text: text,
      model_id: modelId,
      voice_settings: {
        stability: stability,
        similarity_boost: similarityBoost,
        style: style,
        use_speaker_boost: useSpeakerBoost,
      },
      stream: true,
    });

    return audio;
  } catch (error) {
    console.error('ElevenLabs TTS Stream Error:', error);
    throw error;
  }
}

// Voice IDs for different use cases
export const VOICE_PRESETS = {
  // Clear, neutral voice for therapy
  THERAPY: '21m00Tcm4TlvDq8ikWAM', // Rachel
  // Warm, empathetic voice
  EMPATHETIC: 'EXAVITQu4vr4xnSDxMaL', // Bella
  // Professional, clear voice
  PROFESSIONAL: 'pNInz6obpgDQGcFmaJgB', // Adam
  // Calm, soothing voice
  CALM: 'ThT5KcBeYPX3keUQqHPh', // Dorothy
};

export default getClient;
