import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Save a bridge exchange
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      originalText,
      correctedText,
      confidence,
      intent,
      corrections,
      context,
    } = body;

    if (!userId || !originalText || !correctedText) {
      return NextResponse.json(
        { success: false, error: 'userId, originalText, and correctedText are required' },
        { status: 400 }
      );
    }

    const exchange = await prisma.bridgeExchange.create({
      data: {
        userId,
        originalText,
        correctedText,
        confidence: confidence || 0,
        intent: intent || null,
        corrections: JSON.stringify(corrections || []),
        context: context || null,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: exchange.id,
        createdAt: exchange.createdAt,
      },
    });
  } catch (error) {
    console.error('Save bridge exchange error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save exchange' },
      { status: 500 }
    );
  }
}

// Get user's bridge exchanges
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    const exchanges = await prisma.bridgeExchange.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Get stats
    const stats = await prisma.bridgeExchange.aggregate({
      where: { userId },
      _count: true,
      _avg: {
        confidence: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        exchanges: exchanges.map((e) => ({
          ...e,
          corrections: JSON.parse(e.corrections),
        })),
        stats: {
          totalExchanges: stats._count,
          averageConfidence: Math.round((stats._avg.confidence || 0) * 100) / 100,
        },
      },
    });
  } catch (error) {
    console.error('Get bridge exchanges error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get exchanges' },
      { status: 500 }
    );
  }
}

// Delete all exchanges for a user (clear history)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    await prisma.bridgeExchange.deleteMany({
      where: { userId },
    });

    return NextResponse.json({
      success: true,
      message: 'History cleared',
    });
  } catch (error) {
    console.error('Delete bridge exchanges error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clear history' },
      { status: 500 }
    );
  }
}
