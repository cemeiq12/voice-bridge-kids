import { NextRequest, NextResponse } from 'next/server';
import { generatePlayResponse, PlayScenario } from '@/lib/vertexai';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { scenario, childInput, history, persona } = body;

        if (!scenario || !childInput) {
            return NextResponse.json(
                { success: false, error: 'Missing scenario or child input' },
                { status: 400 }
            );
        }

        const result = await generatePlayResponse(
            scenario as PlayScenario,
            childInput,
            history || [],
            persona
        );

        return NextResponse.json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error('Error in play API:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to generate play response' },
            { status: 500 }
        );
    }
}
