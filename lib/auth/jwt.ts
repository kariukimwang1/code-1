import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getEnvVar } from '../utils';

// JWT Token Management
export interface JWTPayload {
  userId: string;
  email: string;
  role: 'user' | 'admin';
  iat?: number;
  exp?: number;
}

export class JWTManager {
  private static readonly JWT_SECRET = getEnvVar('JWT_SECRET') || 'fallback-secret-change-in-production';
  private static readonly EXPIRES_IN = '24h';

  static generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    if (!this.JWT_SECRET || this.JWT_SECRET.includes('fallback-secret')) {
      console.warn('⚠️  Using fallback JWT secret. Please set JWT_SECRET in environment.');
    }

    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.EXPIRES_IN,
      issuer: 'cryptominer-platform',
      audience: 'cryptominer-users',
    });
  }

  static verifyToken(token: string): JWTPayload | null {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET, {
        issuer: 'cryptominer-platform',
        audience: 'cryptominer-users',
      }) as JWTPayload;

      return decoded;
    } catch (error) {
      console.warn('JWT verification failed:', error instanceof Error ? error.message : 'Unknown error');
      return null;
    }
  }

  static refreshToken(token: string): string | null {
    try {
      const decoded = this.verifyToken(token);
      if (!decoded) return null;

      // Create new token without original expiration
      const { iat, exp, ...payload } = decoded;
      return this.generateToken(payload);
    } catch {
      return null;
    }
  }

  static decodeToken(token: string): JWTPayload | null {
    try {
      return jwt.decode(token) as JWTPayload;
    } catch {
      return null;
    }
  }
}

// Password Management
export class PasswordManager {
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  static async comparePassword(password: string, hash: string): Promise<boolean> {
    try {
      return bcrypt.compare(password, hash);
    } catch (error) {
      console.error('Password comparison error:', error);
      return false;
    }
  }

  static validatePasswordStrength(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// Auth Middleware for API Routes
export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

export function authenticateToken(request: Request): JWTPayload | null {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  return JWTManager.verifyToken(token);
}

export function requireAuth(request: Request): JWTPayload {
  const user = authenticateToken(request);

  if (!user) {
    throw new Error('Authentication required');
  }

  return user;
}

export function requireAdmin(request: Request): JWTPayload {
  const user = requireAuth(request);

  if (user.role !== 'admin') {
    throw new Error('Admin access required');
  }

  return user;
}

// Helper Functions
export function createAuthResponse(user: {
  id: string;
  email: string;
  role: 'user' | 'admin';
}) {
  const token = JWTManager.generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    success: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    expiresIn: JWTManager.EXPIRES_IN,
  };
}

export function getAuthFromRequest(request: Request): JWTPayload | null {
  return authenticateToken(request);
}

// Error Types
export class AuthError extends Error {
  constructor(message: string, public statusCode: number = 401) {
    super(message);
    this.name = 'AuthError';
  }
}

export class UnauthorizedError extends AuthError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AuthError {
  constructor(message: string = 'Access forbidden') {
    super(message, 403);
    this.name = 'ForbiddenError';
  }
}

export default {
  JWTManager,
  PasswordManager,
  authenticateToken,
  requireAuth,
  requireAdmin,
  createAuthResponse,
  getAuthFromRequest,
  AuthError,
  UnauthorizedError,
  ForbiddenError,
};