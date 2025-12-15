# Quick Start: ElevenLabs Integration

Get ElevenLabs Text-to-Speech working in your VoiceBridge AI app in 5 minutes!

## Step 1: Install Dependencies

```bash
npm install elevenlabs
```

## Step 2: Get Your API Key

1. Sign up at https://elevenlabs.io
2. Go to your profile → API Keys
3. Copy your API key

## Step 3: Configure Environment

1. Copy the example file:
```bash
cp .env.local.example .env.local
```

2. Edit `.env.local` and add your API key:
```env
ELEVENLABS_API_KEY=your_actual_api_key_here
```

## Step 4: Test the Integration

Once the dev server is running, test the API:

### Test TTS Endpoint
```bash
curl -X POST http://localhost:3000/api/tts \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello from VoiceBridge AI","voiceId":"THERAPY"}' \
  --output test.mp3
```

Then play `test.mp3` to hear the result!

### Test Voice List
```bash
curl http://localhost:3000/api/voices
```

## Step 5: Use in Your Components

### Example: Therapy Mode

```typescript
const playReference = async () => {
  try {
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: selectedPrompt.text,
        voiceId: 'THERAPY',
      }),
    });

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    audio.play();
  } catch (error) {
    console.error('Error playing reference:', error);
  }
};
```

## Available Voice Presets

- `THERAPY` - Clear, neutral (Rachel)
- `EMPATHETIC` - Warm, caring (Bella)
- `PROFESSIONAL` - Clear, professional (Adam)
- `CALM` - Soothing, calm (Dorothy)

## Files Created

✅ `src/lib/elevenlabs.ts` - Core ElevenLabs service
✅ `src/app/api/tts/route.ts` - TTS API endpoint
✅ `src/app/api/voices/route.ts` - Voice list endpoint
✅ `.env.local.example` - Environment variables template
✅ `ELEVENLABS_INTEGRATION.md` - Full integration guide

## Next Steps

1. **Integrate into Therapy Mode**: Replace browser speech synthesis with ElevenLabs
2. **Integrate into Bridge Mode**: Use high-quality voices for corrected speech
3. **Add Voice Selection**: Let users choose their preferred voice
4. **Add Caching**: Cache frequently used audio to save API calls

## Troubleshooting

### "Cannot find module 'elevenlabs'"
Run `npm install` again to ensure the package is installed.

### "API key not found"
Make sure you've created `.env.local` and added your API key.

### "Failed to generate speech"
Check your API key is valid and you have available quota at https://elevenlabs.io

## Cost Estimation

- **Free Tier**: 10,000 characters/month
- **Starter**: $5/month for 30,000 characters
- **Creator**: $22/month for 100,000 characters

Average sentence: ~50-100 characters
Average therapy session: ~500-1000 characters

For full pricing details: https://elevenlabs.io/pricing

## Support

- Full integration guide: `ELEVENLABS_INTEGRATION.md`
- ElevenLabs docs: https://elevenlabs.io/docs
- ElevenLabs support: support@elevenlabs.io
