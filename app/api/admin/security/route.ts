import { NextRequest, NextResponse } from 'next/server';
import { verifyJwt } from '../../../../lib/auth';
import { SecurityHardening } from '../../../../lib/security/security-hardening';

const security = new SecurityHardening();

// Mock security data
const mockSecurityEvents = [
  {
    id: 'sec1',
    type: 'suspicious_login',
    severity: 'high',
    title: 'Multiple Failed Login Attempts',
    description: 'User account "john.doe@example.com" had 5 failed login attempts from unknown IP',
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    userId: 'user123',
    ipAddress: '192.168.1.100',
    status: 'investigating',
    assignedTo: 'security-team',
  },
  {
    id: 'sec2',
    type: 'unusual_access',
    severity: 'medium',
    title: 'Access from Unusual Location',
    description: 'Admin access detected from new geographic location',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    userId: 'admin456',
    ipAddress: '203.0.113.45',
    status: 'reviewed',
    assignedTo: 'admin-team',
  },
  {
    id: 'sec3',
    type: 'brute_force',
    severity: 'critical',
    title: 'Brute Force Attack Detected',
    description: 'Multiple login attempts on admin accounts from suspicious IP range',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6),
    userId: null,
    ipAddress: '203.0.113.0/24',
    status: 'blocked',
    assignedTo: 'security-team',
  },
  {
    id: 'sec4',
    type: 'data_access',
    severity: 'low',
    title: 'Unusual Data Access Pattern',
    description: 'Large volume of data export from user account',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    userId: 'user789',
    ipAddress: '198.51.100.22',
    status: 'monitored',
    assignedTo: 'data-team',
  },
];

const mockSecurityMetrics = {
  totalEvents: 1247,
  criticalEvents: 12,
  highEvents: 67,
  mediumEvents: 234,
  lowEvents: 934,
  blockedIPs: 89,
  activeInvestigations: 15,
  resolvedToday: 23,
  averageResponseTime: 4.5, // minutes
  securityScore: 87.3,
};

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
      resource: 'admin_security',
      action: 'view',
      userId: decoded.userId,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    }, 'low', decoded.userId);

    const { searchParams } = new URL(request.url);
    const eventType = searchParams.get('eventType');
    const severity = searchParams.get('severity');
    const status = searchParams.get('status');

    // Filter security events based on query parameters
    let filteredEvents = [...mockSecurityEvents];

    if (eventType) {
      filteredEvents = filteredEvents.filter(event => event.type === eventType);
    }

    if (severity) {
      filteredEvents = filteredEvents.filter(event => event.severity === severity);
    }

    if (status) {
      filteredEvents = filteredEvents.filter(event => event.status === status);
    }

    return NextResponse.json({
      success: true,
      data: {
        events: filteredEvents,
        metrics: mockSecurityMetrics,
        summary: {
          totalEvents: filteredEvents.length,
          criticalCount: filteredEvents.filter(e => e.severity === 'critical').length,
          highCount: filteredEvents.filter(e => e.severity === 'high').length,
          mediumCount: filteredEvents.filter(e => e.severity === 'medium').length,
          lowCount: filteredEvents.filter(e => e.severity === 'low').length,
        },
      },
    });

  } catch (error) {
    console.error('Error in admin security API:', error);
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

    const { action, eventId, updateData } = await request.json();

    // Log the action
    security.logSecurityEvent('admin_security_action', {
      action,
      eventId,
      updateData,
      adminId: decoded.userId,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    }, 'high', decoded.userId);

    switch (action) {
      case 'update_status':
        const eventIndex = mockSecurityEvents.findIndex(e => e.id === eventId);
        if (eventIndex === -1) {
          return NextResponse.json(
            { error: 'Security event not found' },
            { status: 404 }
          );
        }

        mockSecurityEvents[eventIndex] = {
          ...mockSecurityEvents[eventIndex],
          ...updateData,
          lastUpdated: new Date(),
          updatedBy: decoded.userId,
        };

        return NextResponse.json({
          success: true,
          message: 'Security event updated successfully',
          data: mockSecurityEvents[eventIndex],
        });

      case 'assign_event':
        const assignEventIndex = mockSecurityEvents.findIndex(e => e.id === eventId);
        if (assignEventIndex === -1) {
          return NextResponse.json(
            { error: 'Security event not found' },
            { status: 404 }
          );
        }

        mockSecurityEvents[assignEventIndex].assignedTo = updateData.assignedTo;
        mockSecurityEvents[assignEventIndex].status = 'assigned';

        return NextResponse.json({
          success: true,
          message: 'Security event assigned successfully',
          data: mockSecurityEvents[assignEventIndex],
        });

      case 'block_ip':
        const { ipAddress, reason } = updateData;

        // Log IP blocking action
        security.logSecurityEvent('admin_ip_block', {
          ipAddress,
          reason,
          adminId: decoded.userId,
        }, 'critical', decoded.userId);

        return NextResponse.json({
          success: true,
          message: `IP address ${ipAddress} blocked successfully`,
        });

      case 'investigate_event':
        const investigateIndex = mockSecurityEvents.findIndex(e => e.id === eventId);
        if (investigateIndex === -1) {
          return NextResponse.json(
            { error: 'Security event not found' },
            { status: 404 }
          );
        }

        mockSecurityEvents[investigateIndex].status = 'investigating';
        mockSecurityEvents[investigateIndex].assignedTo = decoded.userId;

        return NextResponse.json({
          success: true,
          message: 'Security investigation started',
          data: mockSecurityEvents[investigateIndex],
        });

      case 'resolve_event':
        const resolveIndex = mockSecurityEvents.findIndex(e => e.id === eventId);
        if (resolveIndex === -1) {
          return NextResponse.json(
            { error: 'Security event not found' },
            { status: 404 }
          );
        }

        mockSecurityEvents[resolveIndex].status = 'resolved';
        mockSecurityEvents[resolveIndex].resolvedAt = new Date();
        mockSecurityEvents[resolveIndex].resolvedBy = decoded.userId;

        return NextResponse.json({
          success: true,
          message: 'Security event resolved successfully',
          data: mockSecurityEvents[resolveIndex],
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in admin security POST API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}