import { NextRequest, NextResponse } from 'next/server';
import { verifyJwt } from '../../../../lib/auth';
import { SecurityHardening } from '../../../../lib/security/security-hardening';

const security = new SecurityHardening();

// Mock user data
const mockUsers = [
  {
    id: '1',
    email: 'user1@example.com',
    name: 'John Doe',
    status: 'active',
    kycLevel: 2,
    balance: 1250.75,
    totalEarnings: 5432.10,
    miningPower: 45.2,
    lastActivity: new Date(Date.now() - 1000 * 60 * 30),
    joinDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90),
    riskScore: 15,
    country: 'United States',
    city: 'New York',
    phone: '+1-555-0123',
    emailVerified: true,
    twoFactorEnabled: true,
    ipAddresses: ['192.168.1.1', '10.0.0.1'],
    devices: [
      {
        id: 'dev1',
        name: 'John\'s Laptop',
        type: 'Desktop',
        lastSeen: new Date(),
        trusted: true,
      },
    ],
    transactions: [
      {
        id: 'tx1',
        type: 'Mining Reward',
        amount: 25.50,
        status: 'completed',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      },
    ],
    securityEvents: [
      {
        id: 'se1',
        type: 'Login',
        description: 'User logged in from new device',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
        severity: 'info',
      },
    ],
  },
  {
    id: '2',
    email: 'user2@example.com',
    name: 'Jane Smith',
    status: 'active',
    kycLevel: 1,
    balance: 890.25,
    totalEarnings: 2341.55,
    miningPower: 32.8,
    lastActivity: new Date(Date.now() - 1000 * 60 * 15),
    joinDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60),
    riskScore: 25,
    country: 'Canada',
    city: 'Toronto',
    emailVerified: false,
    twoFactorEnabled: false,
    ipAddresses: ['192.168.1.2'],
    devices: [],
    transactions: [],
    securityEvents: [
      {
        id: 'se2',
        type: 'Failed Login',
        description: 'Multiple failed login attempts',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
        severity: 'warning',
      },
    ],
  },
  {
    id: '3',
    email: 'user3@example.com',
    name: 'Bob Johnson',
    status: 'suspended',
    kycLevel: 0,
    balance: 234.10,
    totalEarnings: 987.32,
    miningPower: 12.3,
    lastActivity: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    joinDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 180),
    riskScore: 65,
    country: 'United Kingdom',
    city: 'London',
    emailVerified: true,
    twoFactorEnabled: false,
    ipAddresses: ['192.168.1.3'],
    devices: [],
    transactions: [],
    securityEvents: [
      {
        id: 'se3',
        type: 'Suspicious Activity',
        description: 'Unusual login pattern detected',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12),
        severity: 'high',
      },
    ],
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
      resource: 'admin_users',
      action: 'view',
      userId: decoded.userId,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    }, 'low', decoded.userId);

    return NextResponse.json({
      success: true,
      data: mockUsers,
    });

  } catch (error) {
    console.error('Error in admin users API:', error);
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

    const { action, userId } = await request.json();

    // Log the action
    security.logSecurityEvent('admin_user_action', {
      action,
      userId,
      adminId: decoded.userId,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    }, 'medium', decoded.userId);

    // Handle different user actions
    switch (action) {
      case 'suspend':
        const user = mockUsers.find(u => u.id === userId);
        if (user) {
          user.status = 'suspended';
          user.lastActivity = new Date();
        }
        return NextResponse.json({
          success: true,
          message: 'User suspended successfully',
        });

      case 'activate':
        const activeUser = mockUsers.find(u => u.id === userId);
        if (activeUser) {
          activeUser.status = 'active';
          activeUser.lastActivity = new Date();
        }
        return NextResponse.json({
          success: true,
          message: 'User activated successfully',
        });

      case 'ban':
        const bannedUser = mockUsers.find(u => u.id === userId);
        if (bannedUser) {
          bannedUser.status = 'banned';
          bannedUser.lastActivity = new Date();
        }
        return NextResponse.json({
          success: true,
          message: 'User banned successfully',
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in admin users POST API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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

    const { userId, updates } = await request.json();

    // Log the action
    security.logSecurityEvent('admin_user_update', {
      userId,
      updates,
      adminId: decoded.userId,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    }, 'medium', decoded.userId);

    const user = mockUsers.find(u => u.id === userId);
    if (user) {
      Object.assign(user, updates);
      return NextResponse.json({
        success: true,
        data: user,
      });
    }

    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    );

  } catch (error) {
    console.error('Error in admin users PUT API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}