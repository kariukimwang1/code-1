import { NextRequest, NextResponse } from 'next/server';
import { verifyJwt } from '../../../../../lib/auth';
import { SecurityHardening } from '../../../../../lib/security/security-hardening';

const security = new SecurityHardening();

// Mock reports storage
const mockReports = [
  {
    id: 'report1',
    name: 'Daily Performance Report',
    type: 'daily',
    generatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    status: 'completed',
    fileUrl: '/reports/daily_performance_2024-01-07.pdf',
    size: '2.4 MB',
  },
  {
    id: 'report2',
    name: 'Weekly Analytics Summary',
    type: 'weekly',
    generatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    status: 'completed',
    fileUrl: '/reports/weekly_analytics_2024-W01.pdf',
    size: '5.8 MB',
  },
  {
    id: 'report3',
    name: 'Monthly Financial Report',
    type: 'monthly',
    generatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
    status: 'completed',
    fileUrl: '/reports/monthly_financial_2023-12.pdf',
    size: '12.1 MB',
  },
];

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
      resource: 'admin_analytics_reports',
      action: 'view',
      userId: decoded.userId,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    }, 'low', decoded.userId);

    return NextResponse.json({
      success: true,
      data: mockReports,
    });

  } catch (error) {
    console.error('Error in admin analytics reports API:', error);
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

    const { action, type, format, dateRange, customFilters } = await request.json();

    // Log the action
    security.logSecurityEvent('admin_report_generation', {
      action,
      type,
      format,
      dateRange,
      customFilters,
      adminId: decoded.userId,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    }, 'medium', decoded.userId);

    if (action === 'generate') {
      // Generate new report
      const newReport = {
        id: `report${Date.now()}`,
        name: `${type.charAt(0).toUpperCase() + type.slice(1)} Report`,
        type,
        generatedAt: new Date(),
        status: 'generating',
        fileUrl: null,
        size: null,
      };

      // Simulate report generation
      setTimeout(() => {
        newReport.status = 'completed';
        newReport.fileUrl = `/reports/${type}_${format}_${Date.now()}.${format}`;
        newReport.size = `${(Math.random() * 10 + 1).toFixed(1)} MB`;
      }, 3000);

      mockReports.unshift(newReport);

      return NextResponse.json({
        success: true,
        message: `${type.toUpperCase()} report generation started`,
        data: newReport,
      });
    }

    if (action === 'download') {
      const { reportId } = await request.json();
      const report = mockReports.find(r => r.id === reportId);

      if (!report) {
        return NextResponse.json(
          { error: 'Report not found' },
          { status: 404 }
        );
      }

      // In a real implementation, you would serve the actual file
      return NextResponse.json({
        success: true,
        message: 'Report download started',
        downloadUrl: report.fileUrl,
      });
    }

    if (action === 'delete') {
      const { reportId } = await request.json();
      const reportIndex = mockReports.findIndex(r => r.id === reportId);

      if (reportIndex === -1) {
        return NextResponse.json(
          { error: 'Report not found' },
          { status: 404 }
        );
      }

      mockReports.splice(reportIndex, 1);

      return NextResponse.json({
        success: true,
        message: 'Report deleted successfully',
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error in admin analytics reports POST API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}