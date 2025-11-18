import { NextRequest, NextResponse } from 'next/server';
import { verifyJwt } from '../../../../lib/auth';
import { SecurityHardening } from '../../../../lib/security/security-hardening';

const security = new SecurityHardening();

// Mock system settings
const mockSettings = {
  general: {
    siteName: 'CryptoMining Platform',
    siteDescription: 'Advanced cryptocurrency mining and trading platform',
    contactEmail: 'admin@cryptominer.com',
    supportEmail: 'support@cryptominer.com',
    timezone: 'UTC',
    dateFormat: 'YYYY-MM-DD',
    maintenanceMode: false,
  },
  security: {
    twoFactorRequired: true,
    passwordMinLength: 12,
    sessionTimeout: 30, // minutes
    maxLoginAttempts: 5,
    ipWhitelist: [],
    allowedCountries: ['US', 'CA', 'GB', 'DE', 'AU', 'JP'],
    emailVerificationRequired: true,
  },
  mining: {
    minWithdrawal: 0.001,
    withdrawalFee: 0.0001,
    maxMiningRigPerUser: 10,
    autoWithdrawalEnabled: false,
    poolServerEndpoint: 'https://pool.cryptominer.com',
    miningAlgorithm: 'SHA-256',
    difficultyAdjustment: 'automatic',
  },
  notifications: {
    emailNotificationsEnabled: true,
    smsNotificationsEnabled: false,
    pushNotificationsEnabled: true,
    lowBalanceAlert: true,
    miningRigOfflineAlert: true,
    securityAlerts: true,
    maintenanceAlerts: true,
  },
  limits: {
    maxUsersPerIP: 3,
    dailyWithdrawalLimit: 10.0,
    maxAPICallsPerMinute: 100,
    fileUploadSizeLimit: 10, // MB
    concurrentSessionsPerUser: 3,
  },
  features: {
    tradingEnabled: true,
    stakingEnabled: true,
    mobileAppEnabled: true,
    apiAccessEnabled: true,
    referralProgramEnabled: true,
    advancedAnalyticsEnabled: true,
  },
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
      resource: 'admin_settings',
      action: 'view',
      userId: decoded.userId,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    }, 'low', decoded.userId);

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    if (category) {
      return NextResponse.json({
        success: true,
        data: {
          [category]: mockSettings[category as keyof typeof mockSettings] || {},
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: mockSettings,
    });

  } catch (error) {
    console.error('Error in admin settings GET API:', error);
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

    const { action, category, settings } = await request.json();

    // Log the action
    security.logSecurityEvent('admin_settings_update', {
      action,
      category,
      settings,
      adminId: decoded.userId,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    }, 'high', decoded.userId);

    switch (action) {
      case 'update_settings':
        if (!category || !settings) {
          return NextResponse.json(
            { error: 'Category and settings are required' },
            { status: 400 }
          );
        }

        // Update settings
        if (mockSettings[category as keyof typeof mockSettings]) {
          Object.assign(mockSettings[category as keyof typeof mockSettings], settings);
        } else {
          mockSettings[category as keyof typeof mockSettings] = settings;
        }

        return NextResponse.json({
          success: true,
          message: `${category} settings updated successfully`,
          data: {
            [category]: mockSettings[category as keyof typeof mockSettings],
          },
        });

      case 'backup_settings':
        const backupData = {
          timestamp: new Date(),
          adminId: decoded.userId,
          settings: { ...mockSettings },
        };

        return NextResponse.json({
          success: true,
          message: 'Settings backup created',
          data: backupData,
        });

      case 'restore_settings':
        const { backupData: restoreData } = settings;

        if (!restoreData || !restoreData.settings) {
          return NextResponse.json(
            { error: 'Invalid backup data' },
            { status: 400 }
          );
        }

        Object.assign(mockSettings, restoreData.settings);

        return NextResponse.json({
          success: true,
          message: 'Settings restored successfully',
          data: mockSettings,
        });

      case 'reset_defaults':
        const defaultSettings = {
          general: {
            siteName: 'CryptoMining Platform',
            siteDescription: 'Advanced cryptocurrency mining and trading platform',
            contactEmail: 'admin@cryptominer.com',
            supportEmail: 'support@cryptominer.com',
            timezone: 'UTC',
            dateFormat: 'YYYY-MM-DD',
            maintenanceMode: false,
          },
          security: {
            twoFactorRequired: true,
            passwordMinLength: 12,
            sessionTimeout: 30,
            maxLoginAttempts: 5,
            ipWhitelist: [],
            allowedCountries: ['US', 'CA', 'GB', 'DE', 'AU', 'JP'],
            emailVerificationRequired: true,
          },
        };

        Object.assign(mockSettings, defaultSettings);

        return NextResponse.json({
          success: true,
          message: 'Settings reset to defaults',
          data: mockSettings,
        });

      case 'export_settings':
        const exportData = {
          exportedAt: new Date(),
          exportedBy: decoded.userId,
          settings: { ...mockSettings },
        };

        return NextResponse.json({
          success: true,
          message: 'Settings exported successfully',
          data: exportData,
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in admin settings POST API:', error);
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

    const { category, settingKey, settingValue } = await request.json();

    if (!category || !settingKey) {
      return NextResponse.json(
        { error: 'Category and setting key are required' },
        { status: 400 }
      );
    }

    // Log the update
    security.logSecurityEvent('admin_setting_update', {
      category,
      settingKey,
      settingValue,
      adminId: decoded.userId,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    }, 'medium', decoded.userId);

    // Update specific setting
    if (mockSettings[category as keyof typeof mockSettings]) {
      (mockSettings[category as keyof typeof mockSettings] as any)[settingKey] = settingValue;
    } else {
      return NextResponse.json(
        { error: 'Settings category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Setting updated successfully',
      data: {
        category,
        settingKey,
        settingValue,
        updatedBy: decoded.userId,
        updatedAt: new Date(),
      },
    });

  } catch (error) {
    console.error('Error in admin settings PUT API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}