import { NextRequest, NextResponse } from 'next/server';
import { generateWorld } from '@/lib/vertexai';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'nodejs';

async function generateImage(prompt: string): Promise<string | undefined> {
    const apiKey = process.env.GOOGLE_VERTEX_AI_API_KEY;
    if (!apiKey) return undefined;

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        
        // Use Gemini's image generation model (Nano Banana)
        const model = genAI.getGenerativeModel({ 
            model: 'gemini-2.0-flash-exp-image-generation',
            generationConfig: {
                // @ts-ignore - responseModalities is valid for image generation
                responseModalities: ['Text', 'Image'],
            },
        });

        const imagePrompt = `A cute, magical, child-friendly illustration of: ${prompt}. Soft colors, storybook style, whimsical, safe for children.`;
        
        const result = await model.generateContent(imagePrompt);
        const response = result.response;
        
        // Extract image from response parts
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                // Return as data URL for direct use in img src
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
        
        console.log("No image in Gemini response");
        return undefined;
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
