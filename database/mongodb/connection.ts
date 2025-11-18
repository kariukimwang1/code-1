import { MongoClient, Db, Collection, ServerApi, MongoClientOptions } from 'mongodb'
import mongoose from 'mongoose'
import Redis from 'ioredis'
import { EventEmitter } from 'events'

interface DatabaseConfig {
  mongodb: {
    uri: string
    options?: MongoClientOptions
    dbName: string
  }
  redis: {
    host: string
    port: number
    password?: string
    db?: number
    keyPrefix?: string
  }
  maxPoolSize?: number
  minPoolSize?: number
  maxIdleTimeMS?: number
  serverSelectionTimeoutMS?: number
}

class DatabaseManager extends EventEmitter {
  private mongoClient: MongoClient | null = null
  private db: Db | null = null
  private redisClient: Redis | null = null
  private config: DatabaseConfig
  private isConnected = false
  private connectionAttempts = 0
  private maxConnectionAttempts = 5
  private reconnectInterval = 5000

  constructor(config: DatabaseConfig) {
    super()
    this.config = {
      maxPoolSize: 10,
      minPoolSize: 2,
      maxIdleTimeMS: 30000,
      serverSelectionTimeoutMS: 5000,
      ...config
    }
  }

  async connect(): Promise<void> {
    try {
      console.log('🔗 Connecting to databases...')

      await this.connectMongoDB()
      await this.connectRedis()

      this.isConnected = true
      this.connectionAttempts = 0
      this.emit('connected')

      console.log('✅ Database connections established')

      // Set up health checks
      this.setupHealthChecks()

    } catch (error) {
      console.error('❌ Database connection failed:', error)
      this.isConnected = false
      this.emit('error', error)

      // Auto-reconnect logic
      if (this.connectionAttempts < this.maxConnectionAttempts) {
        this.connectionAttempts++
        console.log(`🔄 Retrying connection in ${this.reconnectInterval}ms...`)
        setTimeout(() => this.connect(), this.reconnectInterval)
      } else {
        throw new Error('Failed to connect to databases after maximum attempts')
      }
    }
  }

  private async connectMongoDB(): Promise<void> {
    const mongoOptions: MongoClientOptions = {
      maxPoolSize: this.config.maxPoolSize,
      minPoolSize: this.config.minPoolSize,
      maxIdleTimeMS: this.config.maxIdleTimeMS,
      serverSelectionTimeoutMS: this.config.serverSelectionTimeoutMS,
      retryWrites: true,
      retryReads: true,
      readPreference: 'secondaryPreferred',
      writeConcern: { w: 'majority', j: true },
      readConcern: { level: 'majority' },
      ...this.config.mongodb.options,
      serverApi: ServerApi.version1
    }

    // Connect Mongoose
    await mongoose.connect(this.config.mongodb.uri, {
      ...mongoOptions,
      dbName: this.config.mongodb.dbName
    })

    // Create native MongoDB client for advanced operations
    this.mongoClient = new MongoClient(this.config.mongodb.uri, mongoOptions)
    await this.mongoClient.connect()
    this.db = this.mongoClient.db(this.config.mongodb.dbName)

    console.log('✅ MongoDB connected successfully')
  }

  private async connectRedis(): Promise<void> {
    const redisOptions = {
      host: this.config.redis.host,
      port: this.config.redis.port,
      password: this.config.redis.password,
      db: this.config.redis.db || 0,
      keyPrefix: this.config.redis.keyPrefix || 'miner:',
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      lazyConnect: true,
      keepAlive: 30000,
      connectTimeout: 10000,
      commandTimeout: 5000,
      // Cluster configuration for high availability
      enableOfflineQueue: false,
      enableReadyCheck: true,
      maxLoadingTimeout: 0,
      // Performance optimizations
      family: 4, // Force IPv4
      // Connection pooling
      connectionName: 'miner-app'
    }

    this.redisClient = new Redis(redisOptions)

    // Redis event handlers
    this.redisClient.on('connect', () => {
      console.log('✅ Redis connected successfully')
    })

    this.redisClient.on('error', (error) => {
      console.error('❌ Redis connection error:', error)
      this.emit('redisError', error)
    })

    this.redisClient.on('close', () => {
      console.log('🔌 Redis connection closed')
      this.emit('redisDisconnected')
    })

    this.redisClient.on('reconnecting', () => {
      console.log('🔄 Redis reconnecting...')
      this.emit('redisReconnecting')
    })

    // Test Redis connection
    await this.redisClient.ping()
  }

  private setupHealthChecks(): void {
    // MongoDB health check
    setInterval(async () => {
      if (this.mongoClient && this.isConnected) {
        try {
          await this.db!.admin().ping()
        } catch (error) {
          console.error('MongoDB health check failed:', error)
          this.handleMongoDBDisconnection()
        }
      }
    }, 30000) // Check every 30 seconds

    // Redis health check
    setInterval(async () => {
      if (this.redisClient && this.isConnected) {
        try {
          await this.redisClient.ping()
        } catch (error) {
          console.error('Redis health check failed:', error)
          this.handleRedisDisconnection()
        }
      }
    }, 30000) // Check every 30 seconds
  }

  private async handleMongoDBDisconnection(): Promise<void> {
    console.log('🔌 MongoDB disconnected, attempting to reconnect...')
    try {
      await this.mongoClient?.close()
      await this.connectMongoDB()
    } catch (error) {
      console.error('MongoDB reconnection failed:', error)
    }
  }

  private async handleRedisDisconnection(): Promise<void> {
    console.log('🔌 Redis disconnected, attempting to reconnect...')
    try {
      this.redisClient?.disconnect()
      await this.connectRedis()
    } catch (error) {
      console.error('Redis reconnection failed:', error)
    }
  }

  // MongoDB Methods
  getDatabase(): Db {
    if (!this.db) {
      throw new Error('Database not connected')
    }
    return this.db
  }

  getCollection<T>(name: string): Collection<T> {
    if (!this.db) {
      throw new Error('Database not connected')
    }
    return this.db.collection<T>(name)
  }

  async executeTransaction<T>(
    operations: (session: any) => Promise<T>
  ): Promise<T> {
    const session = mongoose.startSession()
    try {
      await session.withTransaction(async () => {
        return await operations(session)
      })
      return await operations(session)
    } finally {
      await session.endSession()
    }
  }

  // Advanced Query Methods
  async aggregateWithCache<T>(
    collection: string,
    pipeline: any[],
    cacheKey: string,
    ttl: number = 300
  ): Promise<T[]> {
    // Try to get from cache first
    const cached = await this.getFromCache<T[]>(cacheKey)
    if (cached) {
      return cached
    }

    // Execute aggregation
    const results = await this.getCollection(collection).aggregate<T>(pipeline).toArray()

    // Cache results
    await this.setCache(cacheKey, results, ttl)

    return results
  }

  async findOneWithCache<T>(
    collection: string,
    query: any,
    cacheKey: string,
    ttl: number = 300
  ): Promise<T | null> {
    const cached = await this.getFromCache<T>(cacheKey)
    if (cached) {
      return cached
    }

    const result = await this.getCollection<T>(collection).findOne(query)
    if (result) {
      await this.setCache(cacheKey, result, ttl)
    }

    return result
  }

  // Redis Methods
  private async getFromCache<T>(key: string): Promise<T | null> {
    if (!this.redisClient) return null

    try {
      const cached = await this.redisClient.get(key)
      return cached ? JSON.parse(cached) : null
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  }

  private async setCache(key: string, value: any, ttl: number = 300): Promise<void> {
    if (!this.redisClient) return

    try {
      await this.redisClient.setex(key, ttl, JSON.stringify(value))
    } catch (error) {
      console.error('Cache set error:', error)
    }
  }

  async invalidateCache(pattern: string): Promise<void> {
    if (!this.redisClient) return

    try {
      const keys = await this.redisClient.keys(`${pattern}*`)
      if (keys.length > 0) {
        await this.redisClient.del(...keys)
      }
    } catch (error) {
      console.error('Cache invalidation error:', error)
    }
  }

  // Performance Monitoring
  async getDatabaseStats(): Promise<any> {
    try {
      const stats = await this.db!.admin().serverStatus()
      return {
        mongodb: {
          version: stats.version,
          uptime: stats.uptime,
          connections: stats.connections,
          memory: stats.mem,
          network: stats.network
        },
        redis: this.redisClient ? {
          connected: true,
          info: await this.redisClient.info()
        } : {
          connected: false
        }
      }
    } catch (error) {
      console.error('Error getting database stats:', error)
      return null
    }
  }

  // Backup and Restore
  async createBackup(): Promise<string> {
    if (!this.db) {
      throw new Error('Database not connected')
    }

    const collections = await this.db.listCollections().toArray()
    const backup: any = {
      timestamp: new Date().toISOString(),
      collections: {}
    }

    for (const collection of collections) {
      const data = await this.db!.collection(collection.name).find({}).toArray()
      backup.collections[collection.name] = data
    }

    // Store backup in Redis or file system
    const backupKey = `backup:${Date.now()}`
    await this.setCache(backupKey, backup, 86400) // 24 hours

    return backupKey
  }

  async restoreBackup(backupKey: string): Promise<void> {
    const backup = await this.getFromCache(backupKey)
    if (!backup) {
      throw new Error('Backup not found')
    }

    // Restore collections
    for (const [collectionName, data] of Object.entries(backup.collections)) {
      if (Array.isArray(data)) {
        await this.getCollection(collectionName).deleteMany({})
        await this.getCollection(collectionName).insertMany(data)
      }
    }
  }

  // Cleanup
  async disconnect(): Promise<void> {
    console.log('🔌 Disconnecting from databases...')

    if (this.mongoClient) {
      await this.mongoClient.close()
      this.mongoClient = null
    }

    await mongoose.disconnect()

    if (this.redisClient) {
      this.redisClient.disconnect()
      this.redisClient = null
    }

    this.db = null
    this.isConnected = false
    this.emit('disconnected')

    console.log('✅ Database connections closed')
  }

  // Health Check
  async healthCheck(): Promise<any> {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      mongodb: 'disconnected',
      redis: 'disconnected',
      uptime: 0
    }

    try {
      // Check MongoDB
      if (this.mongoClient && this.db) {
        await this.db.admin().ping()
        health.mongodb = 'connected'
      }
    } catch (error) {
      health.mongodb = 'error'
      health.status = 'degraded'
    }

    try {
      // Check Redis
      if (this.redisClient) {
        await this.redisClient.ping()
        health.redis = 'connected'
      }
    } catch (error) {
      health.redis = 'error'
      health.status = 'degraded'
    }

    return health
  }
}

// Singleton instance
let databaseManager: DatabaseManager | null = null

export function initializeDatabase(config: DatabaseConfig): DatabaseManager {
  if (!databaseManager) {
    databaseManager = new DatabaseManager(config)
  }
  return databaseManager
}

export function getDatabase(): DatabaseManager {
  if (!databaseManager) {
    throw new Error('Database not initialized. Call initializeDatabase() first.')
  }
  return databaseManager
}

export default DatabaseManager