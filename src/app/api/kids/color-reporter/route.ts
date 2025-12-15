import { NextRequest, NextResponse } from 'next/server';
import { analyzeColorEmotion } from '@/lib/vertexai';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { color, audioData, persona } = body;

        if (!color || !audioData) {
            return NextResponse.json(
                { success: false, error: 'Missing color or audio data' },
                { status: 400 }
            );
        }

        const result = await analyzeColorEmotion(color, audioData, persona);

        return NextResponse.json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error('Error in color reporter API:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to analyze color emotion' },
            { status: 500 }
        );
    }
}
