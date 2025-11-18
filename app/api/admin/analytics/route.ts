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
      resource: 'admin_analytics',
      action: 'view',
      userId: decoded.userId,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    }, 'low', decoded.userId);

    // Generate comprehensive analytics data
    const analyticsData = {
      users: {
        total: 15420,
        active: 3421,
        new: 127,
        retention: 78.5,
        demographics: [
          { country: 'United States', users: 5420, percentage: 35.2 },
          { country: 'China', users: 3210, percentage: 20.8 },
          { country: 'United Kingdom', users: 1890, percentage: 12.3 },
          { country: 'Germany', users: 1560, percentage: 10.1 },
          { country: 'Canada', users: 1230, percentage: 8.0 },
          { country: 'India', users: 890, percentage: 5.8 },
          { country: 'Australia', users: 670, percentage: 4.3 },
          { country: 'Others', users: 550, percentage: 3.5 },
        ],
      },
      financial: {
        totalRevenue: 2456789.50,
        dailyRevenue: 45678.90,
        monthlyRevenue: 1245678.30,
        transactionVolume: 23456,
        averageTransaction: 104.75,
        revenueBySource: [
          { source: 'Mining Fees', amount: 1234567.80, percentage: 50.2 },
          { source: 'Transaction Fees', amount: 678901.20, percentage: 27.6 },
          { source: 'Premium Features', amount: 345678.90, percentage: 14.1 },
          { source: 'API Services', amount: 123456.30, percentage: 5.0 },
          { source: 'Other', amount: 73185.30, percentage: 3.1 },
        ],
        revenueByMonth: [
          { month: 'Jan', revenue: 987654.32, transactions: 18432 },
          { month: 'Feb', revenue: 1023456.78, transactions: 19876 },
          { month: 'Mar', revenue: 1156789.01, transactions: 21234 },
          { month: 'Apr', revenue: 1087654.32, transactions: 20567 },
          { month: 'May', revenue: 1234567.89, transactions: 22345 },
          { month: 'Jun', revenue: 1345678.90, transactions: 23456 },
        ],
      },
      mining: {
        totalHashrate: 1254.67,
        activeMiners: 3421,
        dailyEarnings: 12567.89,
        efficiency: 87.4,
        distribution: [
          { range: '0-10 TH/s', users: 1823, percentage: 53.3 },
          { range: '10-50 TH/s', users: 1098, percentage: 32.1 },
          { range: '50-100 TH/s', users: 387, percentage: 11.3 },
          { range: '100+ TH/s', users: 113, percentage: 3.3 },
        ],
        performance: [
          { date: '2024-01-01', hashrate: 1123.45, earnings: 10234.56, efficiency: 85.2 },
          { date: '2024-01-02', hashrate: 1156.78, earnings: 10987.65, efficiency: 86.1 },
          { date: '2024-01-03', hashrate: 1234.56, earnings: 11456.78, efficiency: 87.3 },
          { date: '2024-01-04', hashrate: 1278.90, earnings: 12045.67, efficiency: 88.1 },
          { date: '2024-01-05', hashrate: 1254.67, earnings: 12567.89, efficiency: 87.4 },
          { date: '2024-01-06', hashrate: 1298.76, earnings: 12345.67, efficiency: 88.9 },
          { date: '2024-01-07', hashrate: 1345.67, earnings: 12789.01, efficiency: 89.2 },
        ],
      },
      platform: {
        uptime: 99.95,
        responseTime: 145,
        errorRate: 0.002,
        throughput: 1567,
        activeFeatures: [
          { feature: 'Mining', usage: 3421, growth: 12.5 },
          { feature: 'Trading', usage: 2890, growth: 8.3 },
          { feature: 'Staking', usage: 1654, growth: 23.7 },
          { feature: 'API Access', usage: 987, growth: 15.2 },
          { feature: 'Mobile App', usage: 756, growth: 34.1 },
        ],
      },
    };

    return NextResponse.json({
      success: true,
      data: analyticsData,
    });

  } catch (error) {
    console.error('Error in admin analytics API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const { startDate, endDate, metrics, reportType } = await request.json();

    // Log the access
    security.logSecurityEvent('admin_analytics_query', {
      startDate,
      endDate,
      metrics,
      reportType,
      adminId: decoded.userId,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    }, 'medium', decoded.userId);

    // Generate filtered analytics data based on date range
    const filteredData = {
      dateRange: { startDate, endDate },
      metrics: metrics || ['overview'],
      reportType: reportType || 'standard',
      data: {
        // This would typically query the database with the date range
        totalUsers: 15420,
        activeUsers: 3421,
        totalRevenue: 2456789.50,
        // ... other metrics filtered by date range
      },
    };

    return NextResponse.json({
      success: true,
      data: filteredData,
    });

  } catch (error) {
    console.error('Error in admin analytics POST API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
