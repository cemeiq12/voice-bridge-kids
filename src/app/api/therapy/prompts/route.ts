import { NextRequest, NextResponse } from 'next/server';
import { generatePracticePrompts } from '@/lib/vertexai';

// Default practice prompts for fallback
const defaultPrompts = {
  easy: [
    { id: 'e1', text: 'Hello, how are you today?', difficulty: 'easy', category: 'Greetings', targetPhonemes: ['h', 'ow'] },
    { id: 'e2', text: 'I would like a glass of water.', difficulty: 'easy', category: 'Daily Life', targetPhonemes: ['l', 'w'] },
    { id: 'e3', text: 'The sun is bright today.', difficulty: 'easy', category: 'Weather', targetPhonemes: ['s', 'b'] },
    { id: 'e4', text: 'Please pass the salt.', difficulty: 'easy', category: 'Daily Life', targetPhonemes: ['p', 's'] },
    { id: 'e5', text: 'I need to go home now.', difficulty: 'easy', category: 'Daily Life', targetPhonemes: ['n', 'g'] },
  ],
  medium: [
    { id: 'm1', text: 'The quick brown fox jumps over the lazy dog.', difficulty: 'medium', category: 'General', targetPhonemes: ['th', 'qu', 'j'] },
    { id: 'm2', text: 'She sells seashells by the seashore.', difficulty: 'medium', category: 'S Sounds', targetPhonemes: ['sh', 's'] },
    { id: 'm3', text: 'Thank you for your help with this project.', difficulty: 'medium', category: 'Politeness', targetPhonemes: ['th', 'h'] },
    { id: 'm4', text: 'I really appreciate your thoughtful response.', difficulty: 'medium', category: 'Politeness', targetPhonemes: ['r', 'th'] },
    { id: 'm5', text: 'Could you please repeat that more slowly?', difficulty: 'medium', category: 'Requests', targetPhonemes: ['r', 'sl'] },
  ],
  hard: [
    { id: 'h1', text: 'Peter Piper picked a peck of pickled peppers.', difficulty: 'hard', category: 'P Sounds', targetPhonemes: ['p'] },
    { id: 'h2', text: 'How much wood would a woodchuck chuck if a woodchuck could chuck wood?', difficulty: 'hard', category: 'W Sounds', targetPhonemes: ['w', 'ch'] },
    { id: 'h3', text: 'The thirty-three thieves thought they thrilled the throne throughout Thursday.', difficulty: 'hard', category: 'TH Sounds', targetPhonemes: ['th'] },
    { id: 'h4', text: 'Red lorry, yellow lorry, red lorry, yellow lorry.', difficulty: 'hard', category: 'R/L Sounds', targetPhonemes: ['r', 'l'] },
    { id: 'h5', text: 'Specifically, the statistical analysis significantly simplified the situation.', difficulty: 'hard', category: 'S Sounds', targetPhonemes: ['s', 'st'] },
  ],
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const difficulty = searchParams.get('difficulty') as 'easy' | 'medium' | 'hard' || 'easy';
  const category = searchParams.get('category') || undefined;
  const phonemes = searchParams.get('phonemes')?.split(',') || [];

  try {
    // Try to generate AI prompts
    if (phonemes.length > 0 || category) {
      const aiPrompts = await generatePracticePrompts(difficulty, phonemes, category);
      if (aiPrompts.length > 0) {
        return NextResponse.json({
          success: true,
          data: aiPrompts.map((p, i) => ({
            id: `ai_${difficulty}_${i}`,
            text: p.text,
            difficulty,
            category: p.category,
            targetPhonemes: p.targetPhonemes,
          })),
        });
      }
    }

    // Fall back to default prompts
    return NextResponse.json({
      success: true,
      data: defaultPrompts[difficulty] || defaultPrompts.easy,
    });
  } catch (error) {
    console.error('Get prompts error:', error);
    // Return default prompts on error
    return NextResponse.json({
      success: true,
      data: defaultPrompts[difficulty] || defaultPrompts.easy,
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { difficulty = 'easy', targetPhonemes = [], category } = body;

    const prompts = await generatePracticePrompts(
      difficulty as 'easy' | 'medium' | 'hard',
      targetPhonemes,
      category
    );

    if (prompts.length === 0) {
      // Return defaults if AI generation fails
      return NextResponse.json({
        success: true,
        data: defaultPrompts[difficulty as keyof typeof defaultPrompts] || defaultPrompts.easy,
      });
    }

    return NextResponse.json({
      success: true,
      data: prompts.map((p, i) => ({
        id: `gen_${difficulty}_${i}`,
        text: p.text,
        difficulty,
        category: p.category,
        targetPhonemes: p.targetPhonemes,
      })),
    });
  } catch (error) {
    console.error('Generate prompts error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate prompts' },
      { status: 500 }
    );
  }
}
