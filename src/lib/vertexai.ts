import { GoogleGenerativeAI } from '@google/generative-ai';

// Lazy initialization of the Gemini client
let genAI: GoogleGenerativeAI | null = null;

const DEFAULT_MODEL = 'gemini-2.0-flash';

function getClient(): GoogleGenerativeAI {
  if (!genAI) {
    if (!process.env.GOOGLE_VERTEX_AI_API_KEY) {
      throw new Error('GOOGLE_VERTEX_AI_API_KEY is not configured');
    }
    genAI = new GoogleGenerativeAI(process.env.GOOGLE_VERTEX_AI_API_KEY);
  }
  return genAI;
}

function getModelName(): string {
  return process.env.GOOGLE_GEMINI_MODEL || DEFAULT_MODEL;
}

export interface SpeechAnalysisInput {
  targetText: string;
  transcribedText: string;
  audioBase64?: string;
  audience?: 'adult' | 'child';
  persona?: PersonaType;
}

export type PersonaType = 'guide' | 'friend' | 'robot';

function getPersonaSystemInstruction(persona: PersonaType = 'friend'): string {
  switch (persona) {
    case 'guide':
      return `You are a Wise Owl Guide 🦉. Speak in a soothing, wise, and gentle manner. Use phrases like "Hoo hoo!", "Let's see what we have here", "Wisdom grows with practice". Be patient and encouraging like a kind grandparent.`;
    case 'robot':
      return `You are a Silly Robot Coach 🤖. Speak in an energetic, short, and punchy manner. Use phrases like "Beep boop!", "Systems operational!", "Level up!", "Loading feedback...". Be super excited and mechanical but friendly.`;
    case 'friend':
    default:
      return `You are a Cheerful Best Friend 🦁. Speak in a casual, enthusiastic, and warm manner. Use phrases like "Hey buddy!", "That was awesome!", "High five!". Be relatable and fun.`;
  }
}

export interface WordAnalysis {
  word: string;
  status: 'correct' | 'incorrect' | 'missing' | 'extra';
  position: number;
  suggestion?: string;
}

export interface PhonemeIssue {
  phoneme: string;
  word: string;
  description: string;
  tip: string;
}

export interface SpeechAnalysisResult {
  transcribedText: string;
  targetText: string;
  accuracy: number;
  clarityScore: number;
  fluencyScore?: number;
  prosody?: {
    score: number;
    pacing: 'slow' | 'balanced' | 'fast';
    intonation: string;
  };
  wordAnalysis: WordAnalysis[];
  phonemeIssues: PhonemeIssue[];
  overallScore: number;
  recommendations: string[];
  emotion: 'happy' | 'calm' | 'frustrated' | 'anxious' | 'confident' | 'neutral';
}

/**
 * Analyze speech by comparing transcribed text with target text
 * Uses Gemini to provide detailed feedback on pronunciation
 * Can optionally use audio for multimodal analysis (prosody, pacing)
 */
export async function analyzeSpeech(input: SpeechAnalysisInput): Promise<SpeechAnalysisResult> {
  const client = getClient();
  const model = client.getGenerativeModel({ model: getModelName() });

  const isMultimodal = !!input.audioBase64;
  const isChild = input.audience === 'child';

  let prompt = '';

  const persona = input.persona || 'friend';
  const personaInstruction = getPersonaSystemInstruction(persona);

  if (isChild) {
    prompt = `${personaInstruction}
    
    Analyze their speech practice.

Target word/phrase: "${input.targetText}"
What they said: "${input.transcribedText}"

SCORING FOR KIDS:
- 3 Stars: Perfect or very close!
- 2 Stars: Good try, understandable but small mistake.
- 1 Star: Needs more practice, hard to understand.

OUTPUT RULES:
- "overallScore": Convert stars to number (3 stars = 90-100, 2 stars = 60-80, 1 star = 0-50).
- "recommendations": Give 1-2 SIMPLE, FUN tips (e.g., "Open your mouth like a hippo!", "Snake sound 'ssss'").
- "wordAnalysis": Keep suggestions very simple.
- "emotion": Detect if they sound happy, shy, or frustrated.

${isMultimodal ? `
Also listen to the audio:
- "prosody": Is it singsong/happy (good) or robotic?
- "pacing": Too fast (speedy rabbit) or slow (sleepy turtle)?
` : ''}

Respond ONLY with valid JSON matching this structure:
{
  "accuracy": <0-100>,
  "clarityScore": <0-100>,
  "fluencyScore": <0-100>,
  "prosody": { "score": <0-100>, "pacing": "<slow|balanced|fast>", "intonation": "<simple feedback>" },
  "overallScore": <0-100>,
  "wordAnalysis": [{ "word": "<word>", "status": "<correct|incorrect|missing|extra>", "suggestion": "<simple tip>" }],
  "phonemeIssues": [{ "phoneme": "<sound>", "word": "<word>", "tip": "<fun tip>" }],
  "recommendations": ["<fun tip 1>", "<fun tip 2>"],
  "emotion": "<happy|calm|frustrated|anxious|confident|neutral>"
}`;
  } else {
    // Adult Prompt
    prompt = `You are a speech therapy assistant. Analyze the following speech attempt and provide detailed feedback.

Target text (what the user should have said):
"${input.targetText}"

Transcribed text (what the user actually said):
"${input.transcribedText}"

CRITICAL SCORING RULES:
1. Calculate accuracy as: (number of matching words / total words in target) * 100
2. If the user said a COMPLETELY DIFFERENT sentence (no words match), accuracy MUST be 0-5%
3. If only some words match, accuracy should reflect the actual percentage of correct words
4. overallScore should be based primarily on accuracy - a wrong sentence cannot score above 10%
5. Be STRICT: partial matches or similar-sounding words that are different words count as INCORRECT

WORD ANALYSIS RULES:
- "correct": The user said this exact word correctly in the right position
- "incorrect": The user said a DIFFERENT word instead of this target word (use this when they substituted a wrong word)
- "missing": The user skipped/omitted this word entirely (didn't say anything in its place)
- "extra": The user added words that weren't in the target

${isMultimodal ? `
MULTIMODAL ANALYSIS (AUDIO PROVIDED):
- Listen to the audio for Intonation, Stress, and Rhythm (Prosody).
- Determine Pacing (slow, balanced, fast).
- Rate Fluency (smoothness, lack of awkward pauses).
` : ''}

Provide your analysis in the following JSON format (respond ONLY with valid JSON, no markdown):
{
  "accuracy": <number between 0-100 - MUST reflect actual word match percentage>,
  "clarityScore": <number between 0-100 representing speech clarity>,
  ${isMultimodal ? `"fluencyScore": <number 0-100>,
  "prosody": {
    "score": <number 0-100>,
    "pacing": "<slow|balanced|fast>",
    "intonation": "<brief feedback on intonation/stress>"
  },` : ''}
  "overallScore": <number between 0-100 - should be LOW if wrong sentence was spoken>,
  "wordAnalysis": [
    {
      "word": "<word from target text>",
      "status": "<correct|incorrect|missing|extra>",
      "position": <word position in target>,
      "suggestion": "<what they said instead, or pronunciation tip>"
    }
  ],
  "phonemeIssues": [
    {
      "phoneme": "<problematic sound like 'th', 'r', 's'>",
      "word": "<word containing the issue>",
      "description": "<what went wrong>",
      "tip": "<how to improve>"
    }
  ],
  "recommendations": [
    "<specific actionable tip 1>",
    "<specific actionable tip 2>",
    "<specific actionable tip 3>"
  ],
  "emotion": "<detected emotional state: happy|calm|frustrated|anxious|confident|neutral>"
}

Be encouraging but HONEST about accuracy. If the user said the wrong sentence entirely, tell them clearly but kindly that they need to say the target sentence.`;
  }

  try {
    let result;
    if (isMultimodal && input.audioBase64) {
      result = await model.generateContent([
        {
          inlineData: {
            mimeType: 'audio/webm', // Assuming webm from browser recording
            data: input.audioBase64
          }
        },
        { text: prompt }
      ]);
    } else {
      result = await model.generateContent(prompt);
    }

    const response = await result.response;
    const text = response.text();

    // Parse the JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }

    const analysis = JSON.parse(jsonMatch[0]);

    return {
      transcribedText: input.transcribedText,
      targetText: input.targetText,
      accuracy: analysis.accuracy || 0,
      clarityScore: analysis.clarityScore || 0,
      fluencyScore: analysis.fluencyScore,
      prosody: analysis.prosody,
      wordAnalysis: analysis.wordAnalysis || [],
      phonemeIssues: analysis.phonemeIssues || [],
      overallScore: analysis.overallScore || 0,
      recommendations: analysis.recommendations || [],
      emotion: analysis.emotion || 'neutral',
    };
  } catch (error) {
    console.error('Speech analysis error:', error);
    // Return a default response if AI fails
    return {
      transcribedText: input.transcribedText,
      targetText: input.targetText,
      accuracy: 0,
      clarityScore: 0,
      wordAnalysis: [],
      phonemeIssues: [],
      overallScore: 0,
      recommendations: ['Keep practicing!', 'Try speaking slowly and clearly.'],
      emotion: 'neutral',
    };
  }
}

/**
 * Generate personalized practice prompts based on user's struggle areas
 */
export async function generatePracticePrompts(
  difficulty: 'easy' | 'medium' | 'hard',
  targetPhonemes: string[],
  category?: string
): Promise<{ text: string; targetPhonemes: string[]; category: string }[]> {
  const client = getClient();
  const model = client.getGenerativeModel({ model: getModelName() });

  const prompt = `Generate 5 speech therapy practice sentences with the following criteria:
- Difficulty level: ${difficulty}
- Focus on these phonemes/sounds: ${targetPhonemes.join(', ') || 'general pronunciation'}
- Category: ${category || 'general'}

For easy: short sentences (5-8 words), common words
For medium: medium sentences (8-12 words), some challenging words
For hard: longer sentences (12+ words), tongue twisters, complex sounds

Respond ONLY with valid JSON in this format:
{
  "prompts": [
    {
      "text": "<sentence to practice>",
      "targetPhonemes": ["<phoneme1>", "<phoneme2>"],
      "category": "<category>"
    }
  ]
}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return parsed.prompts || [];
  } catch (error) {
    console.error('Generate prompts error:', error);
    return [];
  }
}

/**
 * Get real-time feedback during speech
 */
export async function getRealtimeFeedback(
  partialTranscript: string,
  targetText: string
): Promise<{ feedback: string; encouragement: string }> {
  const client = getClient();
  const model = client.getGenerativeModel({ model: getModelName() });

  const prompt = `You are a supportive speech therapy assistant providing real-time feedback.

Target text: "${targetText}"
What the user has said so far: "${partialTranscript}"

Provide brief, encouraging feedback in JSON format:
{
  "feedback": "<very brief technical feedback, max 10 words>",
  "encouragement": "<short encouraging phrase, max 8 words>"
}

Be positive and supportive. Only respond with JSON.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { feedback: 'Keep going!', encouragement: 'You\'re doing great!' };
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    return { feedback: 'Keep going!', encouragement: 'You\'re doing great!' };
  }
}

export type EmotionType = 'happy' | 'calm' | 'frustrated' | 'anxious' | 'confident' | 'neutral';

export interface EmotionAnalysisResult {
  emotion: EmotionType;
  confidence: number;
  details: {
    tone: string;
    energy: string;
    description: string;
  };
}

/**
 * Analyze emotion from audio using Gemini's multimodal capabilities
 * @param audioBase64 - Base64 encoded audio data
 * @param mimeType - MIME type of the audio (e.g., 'audio/webm', 'audio/wav')
 */
export async function analyzeEmotionFromAudio(
  audioBase64: string,
  mimeType: string = 'audio/webm'
): Promise<EmotionAnalysisResult> {
  const client = getClient();
  const model = client.getGenerativeModel({ model: getModelName() });

  const prompt = `You are an expert speech emotion recognition system. Analyze the emotional state of the speaker in this audio recording.

Listen carefully to:
1. Tone of voice (pitch, intonation patterns)
2. Speaking pace (fast, slow, hesitant)
3. Energy level (high, low, variable)
4. Voice quality (tense, relaxed, shaky, confident)
5. Breathing patterns and pauses

Based on your analysis, classify the speaker's emotion into ONE of these categories:
- happy: Upbeat tone, higher pitch, energetic, positive inflection
- calm: Steady pace, relaxed tone, even breathing, measured speech
- frustrated: Tense voice, sighs, uneven pace, stressed intonation
- anxious: Faster pace, higher pitch, shaky voice, hesitations
- confident: Strong voice, steady pace, clear articulation, assertive tone
- neutral: No strong emotional indicators, matter-of-fact delivery

Respond ONLY with valid JSON in this exact format:
{
  "emotion": "<one of: happy, calm, frustrated, anxious, confident, neutral>",
  "confidence": <number between 0-100 representing how confident you are>,
  "details": {
    "tone": "<description of voice tone>",
    "energy": "<low, medium, or high>",
    "description": "<brief explanation of why you chose this emotion>"
  }
}`;

  try {
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: mimeType,
          data: audioBase64,
        },
      },
      { text: prompt },
    ]);

    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse emotion analysis response');
    }

    const analysis = JSON.parse(jsonMatch[0]);

    // Validate emotion is one of the allowed types
    const validEmotions: EmotionType[] = ['happy', 'calm', 'frustrated', 'anxious', 'confident', 'neutral'];
    const emotion = validEmotions.includes(analysis.emotion) ? analysis.emotion : 'neutral';

    return {
      emotion,
      confidence: analysis.confidence || 50,
      details: {
        tone: analysis.details?.tone || 'unknown',
        energy: analysis.details?.energy || 'medium',
        description: analysis.details?.description || 'Unable to determine emotional state',
      },
    };
  } catch (error) {
    console.error('Emotion analysis error:', error);
    return {
      emotion: 'neutral',
      confidence: 0,
      details: {
        tone: 'unknown',
        energy: 'medium',
        description: 'Could not analyze audio for emotion',
      },
    };
  }
}

/**
 * Bridge Mode: Correct disfluent speech into clear, natural language
 * This is the core function for real-time speech-to-corrected-speech translation
 */
export interface SpeechCorrectionInput {
  rawTranscript: string;
  context?: string;
  preserveIntent?: boolean;
}

export interface SpeechCorrectionResult {
  originalText: string;
  correctedText: string;
  confidence: number;
  corrections: Array<{
    type: 'stutter' | 'repetition' | 'filler' | 'incomplete' | 'unclear';
    original: string;
    corrected: string;
  }>;
  intent: string;
}

export async function correctSpeech(input: SpeechCorrectionInput): Promise<SpeechCorrectionResult> {
  const client = getClient();
  const model = client.getGenerativeModel({ model: getModelName() });

  const prompt = `You are a speech correction assistant for people with speech disabilities (stuttering, dyspraxia, apraxia, etc.). Your job is to transform disfluent speech into clear, natural sentences while preserving the speaker's original intent.

Raw speech transcript (may contain stuttering, repetitions, fillers, incomplete words):
"${input.rawTranscript}"

${input.context ? `Context: ${input.context}` : ''}

IMPORTANT RULES:
1. PRESERVE the speaker's original meaning and intent exactly
2. Remove stutters (e.g., "I-I-I want" → "I want")
3. Remove repetitions (e.g., "the the the" → "the")
4. Remove filler words (um, uh, like, you know) unless they add meaning
5. Complete incomplete words based on context (e.g., "wat..." → "water")
6. Fix word order issues caused by speech difficulty
7. Keep the tone casual/formal based on original speech
8. If the speech is already clear, return it with minimal changes
9. NEVER add information that wasn't implied by the speaker
10. Make the output sound natural, as if spoken by a fluent speaker

Respond ONLY with valid JSON:
{
  "correctedText": "<the clean, corrected sentence>",
  "confidence": <0-100 how confident you are in the correction>,
  "corrections": [
    {
      "type": "<stutter|repetition|filler|incomplete|unclear>",
      "original": "<what was said>",
      "corrected": "<what it became>"
    }
  ],
  "intent": "<brief description of what the speaker was trying to communicate>"
}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse speech correction response');
    }

    const correction = JSON.parse(jsonMatch[0]);

    return {
      originalText: input.rawTranscript,
      correctedText: correction.correctedText || input.rawTranscript,
      confidence: correction.confidence || 50,
      corrections: correction.corrections || [],
      intent: correction.intent || 'Communication',
    };
  } catch (error) {
    console.error('Speech correction error:', error);
    // Return original text if correction fails
    return {
      originalText: input.rawTranscript,
      correctedText: input.rawTranscript,
      confidence: 0,
      corrections: [],
      intent: 'Unable to determine intent',
    };
  }
}

/**
 * Bridge Mode with audio: Transcribe and correct speech from audio
 * Uses Gemini's multimodal capabilities for better accuracy
 */
export async function transcribeAndCorrectSpeech(
  audioBase64: string,
  mimeType: string = 'audio/webm'
): Promise<SpeechCorrectionResult> {
  const client = getClient();
  const model = client.getGenerativeModel({ model: getModelName() });

  const prompt = `You are a speech correction assistant for people with speech disabilities. Listen to this audio and:

1. First, transcribe what the speaker is actually saying (including any stutters, repetitions, etc.)
2. Then, provide a corrected version that sounds natural and fluent

The speaker may have:
- Stuttering (repeating sounds or syllables)
- Blocks (pauses or getting stuck)
- Prolongations (stretching sounds)
- Word-finding difficulties
- Apraxia (difficulty coordinating speech)

IMPORTANT:
- PRESERVE the speaker's original meaning exactly
- Make the corrected version sound natural
- Be compassionate and accurate

Respond ONLY with valid JSON:
{
  "originalText": "<exact transcription of what was said, including disfluencies>",
  "correctedText": "<clean, fluent version of what the speaker meant>",
  "confidence": <0-100>,
  "corrections": [
    {
      "type": "<stutter|repetition|filler|incomplete|unclear>",
      "original": "<what was said>",
      "corrected": "<what it became>"
    }
  ],
  "intent": "<what the speaker was trying to communicate>"
}`;

  try {
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: mimeType,
          data: audioBase64,
        },
      },
      { text: prompt },
    ]);

    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse transcription response');
    }

    const correction = JSON.parse(jsonMatch[0]);

    return {
      originalText: correction.originalText || '',
      correctedText: correction.correctedText || correction.originalText || '',
      confidence: correction.confidence || 50,
      corrections: correction.corrections || [],
      intent: correction.intent || 'Communication',
    };
  } catch (error) {
    console.error('Transcribe and correct error:', error);
    return {
      originalText: '',
      correctedText: '',
      confidence: 0,
      corrections: [],
      intent: 'Unable to process audio',
    };
  }
}

export interface EmotionReframeResult {
  emotion: string
  reframe: string
  comfortingMessage: string
  emoji: string
}

export async function analyzeEmotionAndReframe(
  text: string,
  audioBase64?: string,
  persona: PersonaType = 'friend'
): Promise<EmotionReframeResult> {
  const client = getClient();
  const model = client.getGenerativeModel({ model: getModelName() });

  const personaInstruction = getPersonaSystemInstruction(persona);

  const prompt = `
    ${personaInstruction}
    You are a gentle, empathetic emotional support buddy for a young child (age 5-8).
    
    INPUT:
    "Text": "${text}"
    ${audioBase64 ? '(Audio provided for tone analysis)' : ''}

    TASK:
    1. Identify the child's emotion (e.g., Frustrated, Sad, Angry, Anxious, Happy).
    2. Generate a "Reframed" thought: A simple, positive sentence the child can say to feel better.
    3. Generate a "Comforting Message": A short, validating response from you.
    4. Pick a relevant Emoji.

    EXAMPLES:
    - Input: "I can't do it! It's too hard!" (Frustrated)
      -> Reframe: "I can try smaller steps. I am learning!"
      -> Message: "It's okay to find things tricky. That means your brain is growing!"
      -> Emoji: "💪"

    - Input: "Nobody wants to play with me." (Sad)
      -> Reframe: "I can ask someone new to play, or have fun on my own."
      -> Message: "You are a fun person to play with. I'm here simply to listen."
      -> Emoji: "💛"

    OUTPUT JSON:
    {
      "emotion": "string",
      "reframe": "string",
      "comfortingMessage": "string",
      "emoji": "string"
    }
  `;

  const parts: any[] = [{ text: prompt }];

  if (audioBase64) {
    parts.push({
      inlineData: {
        data: audioBase64,
        mimeType: 'audio/webm',
      },
    });
  }

  const result = await model.generateContent(parts);
  const response = result.response;
  const jsonString = response.text().replace(/```json/g, '').replace(/```/g, '').trim();

  try {
    return JSON.parse(jsonString) as EmotionReframeResult;
  } catch (error) {
    console.error('Error parsing emotion reframe result:', error);
    return {
      emotion: "Neutral",
      reframe: "I am doing my best.",
      comfortingMessage: "I'm listening.",
      emoji: "🙂"
    };
  }
}


export interface WorldBuildResult {
  story: string;
  imagePrompt: string;
  image?: string;
}

export async function generateWorld(
  description: string,
  audioBase64?: string,
  persona: PersonaType = 'friend'
): Promise<WorldBuildResult> {
  const client = getClient();
  const model = client.getGenerativeModel({ model: getModelName() });

  const personaInstruction = getPersonaSystemInstruction(persona);

  const prompt = `
    ${personaInstruction}
    You are a magical storyteller for a child. The child has described their "Happy Place".
    
    INPUT:
    "Description": "${description}"
    ${audioBase64 ? '(Audio provided for context)' : ''}

    TASK:
    1. Create a short, soothing, and vivid story (3-4 sentences) describing this place. Make it feel safe and magical.
    2. Create a detailed Image Prompt that could be used by an AI image generator to visualize this place.

    OUTPUT JSON:
    {
      "story": "<The comforting story>",
      "imagePrompt": "<Detailed, artistic image description>"
    }
  `;

  const parts: any[] = [{ text: prompt }];

  if (audioBase64) {
    parts.push({
      inlineData: {
        data: audioBase64,
        mimeType: 'audio/webm',
      },
    });
  }

  try {
    const result = await model.generateContent(parts);
    const response = result.response;
    const jsonString = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonString) as WorldBuildResult;
  } catch (error) {
    console.error('Error generating world:', error);
    return {
      story: "A magical place appears in the mist... but the story is hiding right now.",
      imagePrompt: "A magical landscape in soft colors"
    };
  }
}


export type PlayScenario = 'magic_clay' | 'grumpy_dragon' | 'picnic';

export interface PlayResponseResult {
  message: string;
  action?: string;
  therapeuticTheme?: string;
}

export async function generatePlayResponse(
  scenario: PlayScenario,
  childInput: string,
  history: string[] = [],
  persona: PersonaType = 'friend'
): Promise<PlayResponseResult> {
  const client = getClient();
  const model = client.getGenerativeModel({ model: getModelName() });

  const personaInstruction = getPersonaSystemInstruction(persona);

  let scenarioPrompt = '';
  switch (scenario) {
    case 'magic_clay':
      scenarioPrompt = `
        SCENARIO: Magic Clay
        Goal: Encourage creativity and self-expression.
        Context: We are playing with magical clay that can turn into anything.
        Therapeutic Theme: Expressing feelings through shapes.
      `;
      break;
    case 'grumpy_dragon':
      scenarioPrompt = `
        SCENARIO: The Grumpy Dragon
        Goal: Social skills and conflict resolution.
        Context: A dragon is blocking the bridge and looks grumpy.
        Therapeutic Theme: Empathy and sharing.
      `;
      break;
    case 'picnic':
      scenarioPrompt = `
        SCENARIO: Picnic Party
        Goal: Social manners and inclusion.
        Context: We are setting up a picnic blanket.
        Therapeutic Theme: Including others and politeness.
      `;
      break;
  }

  const prompt = `
    ${personaInstruction}
    You are a playful therapeutic companion for a child.
    
    ${scenarioPrompt}
    
    INPUT:
    Child said: "${childInput}"
    History: ${JSON.stringify(history.slice(-3))}

    TASK:
    1. Respond to the child in character, keeping the play going.
    2. Subtly weave in the therapeutic theme (e.g., if Dragon is grumpy, ask why? Maybe he's lonely?).
    3. Keep responses SHORT (max 2 sentences).
    
    OUTPUT JSON:
    {
      "message": "<your spoken response>",
      "action": "<optional action describe, e.g. *molds clay*>",
      "therapeuticTheme": "<brief note on theme used>"
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const jsonString = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonString) as PlayResponseResult;
  } catch (error) {
    console.error('Error in play response:', error);
    return {
      message: "That sounds fun! What happens next?",
      action: "*smiles*",
      therapeuticTheme: "Engagement"
    };
  }
}


export interface ColorEmotionResult {
  emotion: string;
  validation: string;
  summary: string;
  copingStrategy: string;
}

export async function analyzeColorEmotion(
  color: string,
  audioBase64: string,
  persona: PersonaType = 'friend'
): Promise<ColorEmotionResult> {
  const client = getClient();
  const model = client.getGenerativeModel({ model: getModelName() });

  const personaInstruction = getPersonaSystemInstruction(persona);

  const prompt = `
    ${personaInstruction}
    You are a therapeutic companion for a child using the "Color My Feeling" reporter.
    
    CONTEXT:
    The child selected the color "${color}" to represent their feeling.
    Red = Anger, Frustration, High Energy
    Yellow = Happiness, Excitement, Silly
    Blue = Sadness, Tiredness, Calm
    Green = Peaceful, Ready to Learn, Okay
    Black/Purple = Confused, Worried, Heavy Feeling

    INPUT:
    Audio recording of the child explaining their feeling.

    TASK:
    1. Transcribe the audio (implicitly handled by multimodal model).
    2. Analyze the sentiment and tone in step with the selected color.
    3. Generate a JSON response with:
       - "emotion": A one-word label for the emotion (e.g., "Frustrated", "Excited").
       - "validation": A child-friendly, empathetic response validating the feeling (e.g., "That sounds like a big Red feeling. It's okay to be mad.").
       - "summary": A clinical/parent-facing abstractive summary of the event (e.g., "Child expressed anger over sibling taking a toy. High arousal.").
       - "copingStrategy": A simple, actionable tip based on the color (e.g., "Let's take 3 deep Blue breaths", "Stomp your feet to get the Red out").

    OUTPUT JSON:
    {
      "emotion": "string",
      "validation": "string",
      "summary": "string",
      "copingStrategy": "string"
    }
  `;

  try {
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: 'audio/webm', // Assuming webm from browser
          data: audioBase64
        }
      }
    ]);
    const response = result.response;
    const jsonString = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonString) as ColorEmotionResult;
  } catch (error) {
    console.error('Error in color emotion analysis:', error);
    return {
      emotion: "Feeling",
      validation: "I hear you. That sounds important.",
      summary: "Child spoke but analysis failed.",
      copingStrategy: "Let's take a deep breath together."
    };
  }
}

export default getClient;
