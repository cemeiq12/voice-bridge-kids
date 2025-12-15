import { NextRequest, NextResponse } from 'next/server';
import { analyzeEmotionAndReframe } from '@/lib/vertexai';

export const runtime = 'nodejs'; // Use Node.js runtime for Vertex AI client

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { text, audioData, persona } = body;

        if (!text && !audioData) {
            return NextResponse.json(
                { success: false, error: 'Missing text or audio data' },
                { status: 400 }
            );
        }

        // Default text if only audio is provided (though frontend should ideally send both or at least one)
        const processedText = text || "Audio input";

        console.log('Analyzing emotion and reframing...');
        const result = await analyzeEmotionAndReframe(processedText, audioData, persona);

        return NextResponse.json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error('Error in emotion mirror API:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to analyze emotion' },
            { status: 500 }
        );
    }
}
