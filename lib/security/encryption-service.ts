import crypto from 'crypto';
import { EventEmitter } from 'events';
import { promisify } from 'util';

const randomBytes = promisify(crypto.randomBytes);
const pbkdf2 = promisify(crypto.pbkdf2);

interface EncryptionConfig {
  algorithm: string;
  keySize: number;
  ivSize: number;
  tagSize: number;
  saltSize: number;
  iterations: number;
  digest: string;
}

interface KeyManagerConfig {
  masterKeyRotationInterval: number;
  keyDerivationSalt: string;
  keyEncryptionAlgorithm: string;
}

interface EncryptionKey {
  id: string;
  keyId: string;
  algorithm: string;
  key: Buffer;
  iv: Buffer;
  createdAt: Date;
  expiresAt: Date;
  isMaster: boolean;
  encryptedKey?: Buffer;
}

interface EncryptedData {
  data: string;
  iv: string;
  tag: string;
  keyId: string;
  algorithm: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

interface EncryptionResult {
  success: boolean;
  data?: string;
  error?: string;
  keyId: string;
  algorithm: string;
  timestamp: Date;
}

export class EncryptionService extends EventEmitter {
  private config: EncryptionConfig;
  private keyManagerConfig: KeyManagerConfig;
  private keys: Map<string, EncryptionKey> = new Map();
  private masterKey: Buffer;
  private keyRotationInterval: NodeJS.Timeout;

  constructor(config: Partial<EncryptionConfig> = {}, keyManagerConfig: Partial<KeyManagerConfig> = {}) {
    super();

    this.config = {
      algorithm: 'aes-256-gcm',
      keySize: 32,
      ivSize: 16,
      tagSize: 16,
      saltSize: 32,
      iterations: 100000,
      digest: 'sha512',
      ...config
    };

    this.keyManagerConfig = {
      masterKeyRotationInterval: 30 * 24 * 60 * 60 * 1000, // 30 days
      keyDerivationSalt: process.env.KEY_DERIVATION_SALT || crypto.randomBytes(32).toString('hex'),
      keyEncryptionAlgorithm: 'aes-256-cbc',
      ...keyManagerConfig
    };

    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      await this.initializeMasterKey();
      await this.loadExistingKeys();
      this.startKeyRotation();
      this.emit('encryption_service_initialized');
    } catch (error) {
      this.emit('encryption_service_error', error);
      throw new Error(`Failed to initialize encryption service: ${error}`);
    }
  }

  private async initializeMasterKey(): Promise<void> {
    // Load master key from environment or key management service
    if (process.env.ENCRYPTION_MASTER_KEY) {
      this.masterKey = Buffer.from(process.env.ENCRYPTION_MASTER_KEY, 'hex');
    } else {
      // In production, this should come from a secure key management service
      console.warn('Using generated master key - not recommended for production');
      this.masterKey = await randomBytes(this.config.keySize);
    }

    // Validate master key
    if (this.masterKey.length !== this.config.keySize) {
      throw new Error('Invalid master key size');
    }
  }

  private async loadExistingKeys(): Promise<void> {
    // In a real implementation, load keys from secure storage
    // For now, create a default key
    await this.generateNewKey('default', true);
  }

  private startKeyRotation(): void {
    this.keyRotationInterval = setInterval(async () => {
      try {
        await this.rotateMasterKey();
      } catch (error) {
        this.emit('key_rotation_error', error);
      }
    }, this.keyManagerConfig.masterKeyRotationInterval);
  }

  // Key Management
  async generateNewKey(keyId: string, isMaster: boolean = false): Promise<EncryptionKey> {
    const key = await randomBytes(this.config.keySize);
    const iv = await randomBytes(this.config.ivSize);

    let encryptedKey: Buffer | undefined;
    if (!isMaster) {
      // Encrypt the key with the master key
      const cipher = crypto.createCipher(this.keyManagerConfig.keyEncryptionAlgorithm, this.masterKey);
      encryptedKey = Buffer.concat([cipher.update(key), cipher.final()]);
    }

    const encryptionKey: EncryptionKey = {
      id: crypto.randomUUID(),
      keyId,
      algorithm: this.config.algorithm,
      key,
      iv,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      isMaster,
      encryptedKey
    };

    this.keys.set(keyId, encryptionKey);
    this.emit('key_created', { keyId, isMaster });

    return encryptionKey;
  }

  async rotateMasterKey(): Promise<void> {
    const newMasterKey = await randomBytes(this.config.keySize);
    const oldMasterKey = this.masterKey;

    try {
      // Re-encrypt all non-master keys with the new master key
      for (const [keyId, encryptionKey] of this.keys.entries()) {
        if (!encryptionKey.isMaster && encryptionKey.encryptedKey) {
          // Decrypt with old master key
          const decipher = crypto.createDecipher(this.keyManagerConfig.keyEncryptionAlgorithm, oldMasterKey);
          const decryptedKey = Buffer.concat([decipher.update(encryptionKey.encryptedKey), decipher.final()]);

          // Re-encrypt with new master key
          const cipher = crypto.createCipher(this.keyManagerConfig.keyEncryptionAlgorithm, newMasterKey);
          encryptionKey.encryptedKey = Buffer.concat([cipher.update(decryptedKey), cipher.final()]);
        }
      }

      this.masterKey = newMasterKey;
      this.emit('master_key_rotated', { timestamp: new Date() });

    } catch (error) {
      // Rollback on failure
      this.masterKey = oldMasterKey;
      throw new Error(`Master key rotation failed: ${error}`);
    }
  }

  private getKey(keyId: string): EncryptionKey {
    const key = this.keys.get(keyId);
    if (!key) {
      throw new Error(`Encryption key not found: ${keyId}`);
    }

    if (key.expiresAt < new Date()) {
      throw new Error(`Encryption key expired: ${keyId}`);
    }

    return key;
  }

  private async decryptKey(key: EncryptionKey): Promise<Buffer> {
    if (key.isMaster || !key.encryptedKey) {
      return key.key;
    }

    try {
      const decipher = crypto.createDecipher(this.keyManagerConfig.keyEncryptionAlgorithm, this.masterKey);
      return Buffer.concat([decipher.update(key.encryptedKey), decipher.final()]);
    } catch (error) {
      throw new Error(`Failed to decrypt key: ${error}`);
    }
  }

  // Data Encryption
  async encrypt(
    data: string | Buffer,
    keyId: string = 'default',
    additionalData?: string,
    metadata?: Record<string, any>
  ): Promise<EncryptionResult> {
    try {
      const encryptionKey = this.getKey(keyId);
      const decryptedKey = await this.decryptKey(encryptionKey);

      const iv = await randomBytes(this.config.ivSize);
      const cipher = crypto.createCipher(encryptionKey.algorithm, decryptedKey);

      if (additionalData) {
        cipher.setAAD(Buffer.from(additionalData));
      }

      let encrypted = cipher.update(data, 'utf8' as any, 'hex');
      encrypted += cipher.final('hex');

      const tag = cipher.getAuthTag();

      const encryptedData: EncryptedData = {
        data: encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex'),
        keyId,
        algorithm: encryptionKey.algorithm,
        timestamp: new Date(),
        metadata
      };

      this.emit('data_encrypted', { keyId, dataSize: Buffer.byteLength(data.toString()) });

      return {
        success: true,
        data: JSON.stringify(encryptedData),
        keyId,
        algorithm: encryptionKey.algorithm,
        timestamp: new Date()
      };

    } catch (error) {
      this.emit('encryption_error', { error, keyId });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Encryption failed',
        keyId,
        algorithm: this.config.algorithm,
        timestamp: new Date()
      };
    }
  }

  async decrypt(
    encryptedData: string,
    additionalData?: string
  ): Promise<EncryptionResult> {
    try {
      const data: EncryptedData = JSON.parse(encryptedData);
      const encryptionKey = this.getKey(data.keyId);
      const decryptedKey = await this.decryptKey(encryptionKey);

      const decipher = crypto.createDecipher(encryptionKey.algorithm, decryptedKey);
      decipher.setAuthTag(Buffer.from(data.tag, 'hex'));

      if (additionalData) {
        decipher.setAAD(Buffer.from(additionalData));
      }

      let decrypted = decipher.update(data.data, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      this.emit('data_decrypted', { keyId: data.keyId });

      return {
        success: true,
        data: decrypted,
        keyId: data.keyId,
        algorithm: data.algorithm,
        timestamp: new Date()
      };

    } catch (error) {
      this.emit('decryption_error', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Decryption failed',
        keyId: 'unknown',
        algorithm: 'unknown',
        timestamp: new Date()
      };
    }
  }

  // Field-level encryption for sensitive data
  async encryptField(
    value: string,
    fieldType: string,
    userId?: string
  ): Promise<EncryptionResult> {
    const keyId = `field_${fieldType}`;
    const additionalData = `${fieldType}:${userId || 'anonymous'}`;

    return this.encrypt(value, keyId, additionalData, {
      fieldType,
      userId,
      encryptedAt: new Date().toISOString()
    });
  }

  async decryptField(
    encryptedValue: string,
    fieldType: string,
    userId?: string
  ): Promise<EncryptionResult> {
    const additionalData = `${fieldType}:${userId || 'anonymous'}`;
    return this.decrypt(encryptedValue, additionalData);
  }

  // Database encryption helpers
  encryptDatabaseObject(obj: Record<string, any>, sensitiveFields: string[]): Record<string, any> {
    const encrypted: Record<string, any> = { ...obj };

    for (const field of sensitiveFields) {
      if (obj[field] !== undefined && obj[field] !== null) {
        const result = this.encryptSync(obj[field].toString(), `field_${field}`);
        if (result.success) {
          encrypted[field] = result.data;
        }
      }
    }

    return encrypted;
  }

  decryptDatabaseObject(encryptedObj: Record<string, any>, sensitiveFields: string[]): Record<string, any> {
    const decrypted: Record<string, any> = { ...encryptedObj };

    for (const field of sensitiveFields) {
      if (encryptedObj[field] !== undefined && encryptedObj[field] !== null) {
        if (typeof encryptedObj[field] === 'string') {
          const result = this.decryptSync(encryptedObj[field], `field_${field}`);
          if (result.success) {
            decrypted[field] = result.data;
          }
        }
      }
    }

    return decrypted;
  }

  // Password hashing and verification
  async hashPassword(password: string, salt?: string): Promise<{ hash: string; salt: string }> {
    const passwordSalt = salt || (await randomBytes(16)).toString('hex');
    const hash = crypto.pbkdf2Sync(password, passwordSalt, this.config.iterations, this.config.keySize, this.config.digest);

    return {
      hash: hash.toString('hex'),
      salt: passwordSalt
    };
  }

  async verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
    try {
      const hashedPassword = crypto.pbkdf2Sync(password, salt, this.config.iterations, this.config.keySize, this.config.digest);
      return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), hashedPassword);
    } catch {
      return false;
    }
  }

  // Token generation and verification
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  generateJWTToken(payload: any, expiresIn: string = '1h'): { token: string; expiresAt: Date } {
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };

    const now = Math.floor(Date.now() / 1000);
    const exp = now + this.parseExpiration(expiresIn);

    const tokenPayload = {
      ...payload,
      iat: now,
      exp
    };

    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(tokenPayload)).toString('base64url');

    const signature = crypto
      .createHmac('sha256', this.masterKey)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');

    const token = `${encodedHeader}.${encodedPayload}.${signature}`;
    const expiresAt = new Date(exp * 1000);

    return { token, expiresAt };
  }

  verifyJWTToken(token: string): { valid: boolean; payload?: any; error?: string } {
    try {
      const [header, payload, signature] = token.split('.');

      if (!header || !payload || !signature) {
        return { valid: false, error: 'Invalid token format' };
      }

      // Verify signature
      const expectedSignature = crypto
        .createHmac('sha256', this.masterKey)
        .update(`${header}.${payload}`)
        .digest('base64url');

      if (signature !== expectedSignature) {
        return { valid: false, error: 'Invalid signature' };
      }

      // Decode payload
      const decodedPayload = JSON.parse(Buffer.from(payload, 'base64url').toString());

      // Check expiration
      if (decodedPayload.exp && decodedPayload.exp < Math.floor(Date.now() / 1000)) {
        return { valid: false, error: 'Token expired' };
      }

      return { valid: true, payload: decodedPayload };

    } catch (error) {
      return { valid: false, error: 'Token verification failed' };
    }
  }

  // Secure random number generation
  generateSecureRandom(min: number, max: number): number {
    const range = max - min + 1;
    const bytesNeeded = Math.ceil(Math.log2(range) / 8);
    const maxValue = Math.pow(256, bytesNeeded);
    const threshold = maxValue - (maxValue % range);

    let randomBytes: Buffer;
    do {
      randomBytes = crypto.randomBytes(bytesNeeded);
    } while (randomBytes.readUIntBE(0, bytesNeeded) >= threshold);

    return min + (randomBytes.readUIntBE(0, bytesNeeded) % range);
  }

  generateUUID(): string {
    return crypto.randomUUID();
  }

  // API Key management
  generateAPIKey(userId: string, permissions: string[] = []): { apiKey: string; keyId: string; expiresAt: Date } {
    const keyId = crypto.randomUUID();
    const timestamp = Date.now().toString();
    const random = crypto.randomBytes(16).toString('hex');

    const apiKey = `sk_${timestamp}_${Buffer.from(`${userId}:${keyId}:${random}`).toString('base64')}`;
    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year

    // Hash and store the API key
    this.hashAPIKey(apiKey, userId, permissions, expiresAt);

    return { apiKey, keyId, expiresAt };
  }

  async verifyAPIKey(apiKey: string): Promise<{ valid: boolean; userId?: string; permissions?: string[]; error?: string }> {
    try {
      // Decode API key
      const decoded = Buffer.from(apiKey.replace('sk_', '').split('_')[1], 'base64').toString();
      const [userId, keyId] = decoded.split(':');

      if (!userId || !keyId) {
        return { valid: false, error: 'Invalid API key format' };
      }

      // In a real implementation, verify against database
      // For now, just return success
      return {
        valid: true,
        userId,
        permissions: ['read', 'write']
      };

    } catch (error) {
      return { valid: false, error: 'API key verification failed' };
    }
  }

  private hashAPIKey(apiKey: string, userId: string, permissions: string[], expiresAt: Date): void {
    const hash = crypto.createHash('sha256').update(apiKey).digest('hex');
    // In a real implementation, store this in the database
    this.emit('api_key_created', { userId, permissions, expiresAt, hash });
  }

  // File encryption
  async encryptFile(buffer: Buffer, keyId: string = 'default'): Promise<{ encryptedBuffer: Buffer; iv: Buffer; tag: Buffer }> {
    const encryptionKey = this.getKey(keyId);
    const decryptedKey = await this.decryptKey(encryptionKey);

    const iv = await randomBytes(this.config.ivSize);
    const cipher = crypto.createCipher(encryptionKey.algorithm, decryptedKey);

    const encryptedBuffer = Buffer.concat([cipher.update(buffer), cipher.final()]);
    const tag = cipher.getAuthTag();

    return { encryptedBuffer, iv, tag };
  }

  async decryptFile(
    encryptedBuffer: Buffer,
    iv: Buffer,
    tag: Buffer,
    keyId: string = 'default'
  ): Promise<Buffer> {
    const encryptionKey = this.getKey(keyId);
    const decryptedKey = await this.decryptKey(encryptionKey);

    const decipher = crypto.createDecipher(encryptionKey.algorithm, decryptedKey);
    decipher.setAuthTag(tag);

    return Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
  }

  // Utility methods
  private parseExpiration(expiresIn: string): number {
    const units: Record<string, number> = {
      's': 1,
      'm': 60,
      'h': 3600,
      'd': 86400,
      'w': 604800,
      'y': 31536000
    };

    const match = expiresIn.match(/^(\d+)([smhdwy])$/);
    if (!match) {
      throw new Error('Invalid expiration format');
    }

    const [, amount, unit] = match;
    return parseInt(amount) * (units[unit] || 1);
  }

  // Sync encryption methods for simple cases (not recommended for production)
  private encryptSync(data: string, keyId: string = 'default'): EncryptionResult {
    try {
      const encryptionKey = this.getKey(keyId);
      const iv = crypto.randomBytes(this.config.ivSize);
      const cipher = crypto.createCipher(encryptionKey.algorithm, encryptionKey.key);

      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const tag = cipher.getAuthTag();

      const encryptedData: EncryptedData = {
        data: encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex'),
        keyId,
        algorithm: encryptionKey.algorithm,
        timestamp: new Date()
      };

      return {
        success: true,
        data: JSON.stringify(encryptedData),
        keyId,
        algorithm: encryptionKey.algorithm,
        timestamp: new Date()
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Encryption failed',
        keyId,
        algorithm: this.config.algorithm,
        timestamp: new Date()
      };
    }
  }

  private decryptSync(encryptedData: string): EncryptionResult {
    try {
      const data: EncryptedData = JSON.parse(encryptedData);
      const encryptionKey = this.getKey(data.keyId);

      const decipher = crypto.createDecipher(encryptionKey.algorithm, encryptionKey.key);
      decipher.setAuthTag(Buffer.from(data.tag, 'hex'));

      let decrypted = decipher.update(data.data, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return {
        success: true,
        data: decrypted,
        keyId: data.keyId,
        algorithm: data.algorithm,
        timestamp: new Date()
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Decryption failed',
        keyId: 'unknown',
        algorithm: 'unknown',
        timestamp: new Date()
      };
    }
  }

  // Public API for management
  getMetrics(): any {
    return {
      totalKeys: this.keys.size,
      masterKeyAge: this.keys.get('master') ? Date.now() - this.keys.get('master')!.createdAt.getTime() : 0,
      config: this.config,
      lastKeyRotation: this.keyRotationInterval ? new Date() : null
    };
  }

  async revokeKey(keyId: string): Promise<void> {
    const key = this.keys.get(keyId);
    if (key) {
      key.expiresAt = new Date(); // Expire immediately
      this.emit('key_revoked', { keyId });
    }
  }

  cleanup(): void {
    if (this.keyRotationInterval) {
      clearInterval(this.keyRotationInterval);
    }

    this.keys.clear();
    this.removeAllListeners();
  }
}