import { NextRequest, NextResponse } from 'next/server';
import { generateWorld } from '@/lib/vertexai';

export const runtime = 'nodejs';

async function generateImage(prompt: string): Promise<string | undefined> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return undefined;

    try {
        const response = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "dall-e-3",
                prompt: `A cute, magical, child-friendly illustration of: ${prompt}. Soft colors, storybook style.`,
                n: 1,
                size: "1024x1024"
            })
        });

        if (!response.ok) {
            console.error("OpenAI Image Gen failed", await response.text());
            return undefined;
        }

        const data = await response.json();
        return data.data[0].url;
    } catch (error) {
        console.error('Image generation error:', error);
        return undefined;
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { text, audioData, persona } = body;

        if (!text && !audioData) {
            return NextResponse.json(
                { success: false, error: 'Missing input' },
                { status: 400 }
            );
        }

        // 1. Generate Story & Prompts with Gemini
        const processedText = text || "A magical place";
        const worldData = await generateWorld(processedText, audioData, persona);

        // 2. Generate Image (Optional)
        let imageUrl: string | undefined = undefined;
        if (worldData.imagePrompt) {
            imageUrl = await generateImage(worldData.imagePrompt);
        }

        return NextResponse.json({
            success: true,
            data: {
                ...worldData,
                image: imageUrl
            },
        });
    } catch (error) {
        console.error('Error in world build API:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to build world' },
            { status: 500 }
        );
    }
}
