import { NextRequest, NextResponse } from 'next/server';
import { verifyJwt } from '../../../../lib/auth';
import { SecurityHardening } from '../../../../lib/security/security-hardening';

const security = new SecurityHardening();

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyJwt(token);

    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Log the access
    security.logSecurityEvent('admin_access', {
      resource: 'admin_overview',
      action: 'view',
      userId: decoded.userId,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    }, 'low', decoded.userId);

    // Generate mock data for the overview
    const metrics = {
      totalUsers: 15420,
      activeUsers: 3421,
      totalMiningPower: 1254.67,
      dailyRevenue: 45678.90,
      totalTransactions: 23456,
      systemHealth: 98.5,
      securityScore: 94.2,
      uptime: 99.95,
    };

    return NextResponse.json({
      success: true,
      data: metrics,
    });

  } catch (error) {
    console.error('Error in admin overview API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}