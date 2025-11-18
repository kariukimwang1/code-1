import { NextRequest, NextResponse } from 'next/server';
import { AIRecommendationEngine } from '../../../lib/ai/recommendation-engine';

const recommendationEngine = new AIRecommendationEngine();

// Initialize the recommendation engine when the module loads
let isInitialized = false;
async function ensureInitialized() {
  if (!isInitialized) {
    await recommendationEngine.initialize();
    isInitialized = true;
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureInitialized();

    const { userId, limit = 10, context = 'tasks' } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    let recommendations;

    switch (context) {
      case 'tasks':
        recommendations = await recommendationEngine.generateRecommendations(userId, limit);
        break;
      case 'personalized':
        recommendations = await recommendationEngine.generatePersonalizedContent(userId, 'tasks');
        break;
      case 'journey_optimization':
        recommendations = await recommendationEngine.optimizeUserJourney(userId);
        break;
      default:
        recommendations = await recommendationEngine.generateRecommendations(userId, limit);
    }

    return NextResponse.json({
      success: true,
      data: {
        recommendations,
        metadata: {
          timestamp: new Date().toISOString(),
          context,
          userId,
          count: recommendations.length || 1
        }
      }
    });

  } catch (error) {
    console.error('Error generating recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to generate recommendations', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await ensureInitialized();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const timeframe = (searchParams.get('timeframe') || 'week') as 'week' | 'month' | 'quarter';

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const [trends, anomalies] = await Promise.all([
      recommendationEngine.predictTrends(timeframe),
      recommendationEngine.detectAnomalies(userId)
    ]);

    return NextResponse.json({
      success: true,
      data: {
        userId,
        timeframe,
        trends,
        anomalies,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error getting AI insights:', error);
    return NextResponse.json(
      { error: 'Failed to get AI insights', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}