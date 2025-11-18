import { NextRequest, NextResponse } from 'next/server';
import { FraudDetectionSystem } from '../../../lib/security/fraud-detection';

const fraudDetection = new FraudDetectionSystem();

export async function POST(request: NextRequest) {
  try {
    const {
      transaction,
      user,
      deviceInfo,
      ipInfo
    } = await request.json();

    if (!transaction || !user) {
      return NextResponse.json(
        { error: 'Transaction and user data are required' },
        { status: 400 }
      );
    }

    // Analyze transaction for fraud
    const riskScore = await fraudDetection.analyzeTransaction(
      transaction,
      user,
      deviceInfo || {},
      ipInfo || {}
    );

    return NextResponse.json({
      success: true,
      data: {
        riskScore,
        decision: getTransactionDecision(riskScore),
        recommendations: riskScore.recommendations
      }
    });

  } catch (error) {
    console.error('Error in fraud detection:', error);
    return NextResponse.json(
      { error: 'Failed to analyze transaction', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');

    switch (action) {
      case 'alerts':
        const alerts = fraudDetection.getAlerts(userId || undefined);
        return NextResponse.json({
          success: true,
          data: { alerts }
        });

      case 'metrics':
        const metrics = fraudDetection.getMetrics();
        return NextResponse.json({
          success: true,
          data: { metrics }
        });

      case 'patterns':
        // Return fraud patterns (for admin dashboard)
        return NextResponse.json({
          success: true,
          data: { patterns: [] } // Would expose patterns if needed
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in fraud detection GET:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fraud detection data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { alertId, resolution, action } = await request.json();

    if (action === 'resolve_alert' && alertId && resolution) {
      fraudDetection.resolveAlert(alertId, resolution);

      return NextResponse.json({
        success: true,
        message: `Alert ${alertId} resolved as ${resolution}`
      });
    }

    if (action === 'update_patterns' && resolution) {
      await fraudDetection.updateFraudPatterns(resolution);

      return NextResponse.json({
        success: true,
        message: 'Fraud patterns updated successfully'
      });
    }

    return NextResponse.json(
      { error: 'Invalid action or missing parameters' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error in fraud detection PUT:', error);
    return NextResponse.json(
      { error: 'Failed to update fraud detection', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function getTransactionDecision(riskScore: any): string {
  switch (riskScore.level) {
    case 'critical':
      return 'block';
    case 'high':
      return 'manual_review';
    case 'medium':
      return 'additional_verification';
    case 'low':
      return 'approve';
    default:
      return 'approve';
  }
}