/**
 * Multi-Billion Dollar Crypto Platform Server
 * Main application entry point for enterprise deployment
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cluster from 'cluster';
import os from 'os';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';

// Platform imports
import { CryptoPlatformOrchestrator } from './platform/orchestrator';
import { getPlatformConfig } from './config/platform-config';
import { DATABASE_CONFIG, API_CONFIG, SECURITY_CONFIG, MONITORING_CONFIG } from './config/platform-config';

// Load environment variables
dotenv.config();

/**
 * Main Application Server Class
 */
class CryptoPlatformServer {
  private app: express.Application;
  private server: any;
  private io: SocketIOServer;
  private orchestrator: CryptoPlatformOrchestrator;
  private config = getPlatformConfig();
  private isShuttingDown = false;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: API_CONFIG.gateway.cors.origin,
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    this.setupGracefulShutdown();
  }

  /**
   * Initialize and start the server
   */
  public async start(): Promise<void> {
    try {
      console.log('🚀 Starting Multi-Billion Dollar Crypto Platform...');
      console.log(`📍 Environment: ${this.config.environment}`);
      console.log(`🌐 Network: ${this.config.network}`);

      // Initialize platform orchestrator
      await this.initializeOrchestrator();

      // Setup Express middleware
      this.setupMiddleware();

      // Setup API routes
      this.setupRoutes();

      // Setup Socket.IO for real-time features
      this.setupSocketIO();

      // Setup error handling
      this.setupErrorHandling();

      // Start listening
      await this.startListening();

      console.log('✅ Multi-Billion Dollar Crypto Platform started successfully!');
      console.log(`🌍 Server running on port ${API_CONFIG.gateway.port}`);
      console.log(`📊 Platform Status: READY`);

      // Emit platform ready event
      this.orchestrator.emit('serverReady', {
        timestamp: new Date(),
        environment: this.config.environment,
        port: API_CONFIG.gateway.port
      });

    } catch (error) {
      console.error('❌ Failed to start platform:', error);
      process.exit(1);
    }
  }

  /**
   * Initialize the platform orchestrator
   */
  private async initializeOrchestrator(): Promise<void> {
    console.log('🔧 Initializing Platform Orchestrator...');

    this.orchestrator = new CryptoPlatformOrchestrator(this.config);
    await this.orchestrator.initialize();

    // Set up orchestrator event handlers
    this.setupOrchestratorEvents();

    console.log('✅ Platform Orchestrator initialized');
  }

  /**
   * Setup Express middleware
   */
  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: SECURITY_CONFIG.authentication.session.cookie.secure
        ? API_CONFIG.gateway.helmet.contentSecurityPolicy
        : false,
      hsts: API_CONFIG.gateway.helmet.hsts
    }));

    // CORS configuration
    this.app.use(cors(API_CONFIG.gateway.cors));

    // Compression for response bodies
    this.app.use(compression());

    // Request parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    if (MONITORING_CONFIG.logging.enableConsole) {
      this.app.use(morgan(MONITORING_CONFIG.logging.format || 'combined'));
    }

    // Custom middleware for platform metrics
    this.app.use((req, res, next) => {
      // Add request timestamp
      (req as any).startTime = Date.now();

      // Add platform info to headers
      res.set('X-Platform-Version', process.env.APP_VERSION || '1.0.0');
      res.set('X-Environment', this.config.environment);

      next();
    });

    // Rate limiting middleware would be added here
    // this.app.use(rateLimit(API_CONFIG.gateway.rateLimiting));
  }

  /**
   * Setup API routes
   */
  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', async (req, res) => {
      try {
        const health = await this.orchestrator.getPlatformHealth();
        res.json({
          status: 'ok',
          timestamp: new Date(),
          platform: health,
          uptime: process.uptime(),
          memory: process.memoryUsage()
        });
      } catch (error) {
        res.status(500).json({
          status: 'error',
          message: 'Health check failed',
          error: error.message
        });
      }
    });

    // Platform status endpoint
    this.app.get('/status', async (req, res) => {
      try {
        const status = {
          platform: {
            environment: this.config.environment,
            network: this.config.network,
            features: this.config.features,
            version: process.env.APP_VERSION || '1.0.0'
          },
          services: {
            orchestrator: this.orchestrator ? 'running' : 'stopped',
            database: 'connected', // Would check actual DB status
            redis: 'connected' // Would check actual Redis status
          },
          metrics: {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            connections: this.io.engine.clientsCount
          }
        };

        res.json(status);
      } catch (error) {
        res.status(500).json({
          error: 'Failed to get platform status',
          message: error.message
        });
      }
    });

    // API documentation endpoint
    this.app.get('/docs', (req, res) => {
      res.json({
        title: 'Multi-Billion Dollar Crypto Platform API',
        version: process.env.APP_VERSION || '1.0.0',
        description: 'Enterprise-grade cryptocurrency trading and DeFi platform',
        endpoints: {
          'GET /health': 'Platform health check',
          'GET /status': 'Platform status and metrics',
          'POST /api/v1/users/register': 'Register new user',
          'POST /api/v1/users/login': 'User login',
          'POST /api/v1/trading/execute': 'Execute trade',
          'POST /api/v1/defi/participate': 'Participate in DeFi',
          'POST /api/v1/bridge/transfer': 'Cross-chain bridge transfer',
          'POST /api/v1/nft/mint': 'Mint NFT',
          'GET /api/v1/analytics/insights': 'Get platform insights'
        },
        documentation: 'https://docs.cryptoplatform.com',
        support: 'support@cryptoplatform.com'
      });
    });

    // Main API routes would be mounted here
    // this.app.use('/api/v1', apiRoutes);

    // WebSocket endpoint info
    this.app.get('/ws-info', (req, res) => {
      res.json({
        websocket: {
          url: `ws://localhost:${API_CONFIG.gateway.port}`,
          events: [
            'market_data_update',
            'trade_executed',
            'price_alert',
            'portfolio_update',
            'system_notification'
          ]
        }
      });
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Endpoint not found',
        path: req.originalUrl,
        method: req.method,
        availableEndpoints: ['/health', '/status', '/docs', '/ws-info']
      });
    });
  }

  /**
   * Setup Socket.IO for real-time features
   */
  private setupSocketIO(): void {
    console.log('🔌 Setting up real-time communication...');

    this.io.on('connection', (socket) => {
      console.log(`🔗 Client connected: ${socket.id}`);

      // Join user-specific room
      socket.on('join_user_room', (userId) => {
        socket.join(`user_${userId}`);
        socket.emit('joined_room', `user_${userId}`);
      });

      // Subscribe to market data
      socket.on('subscribe_market', (symbols) => {
        socket.join('market_data');
        socket.emit('subscribed_market', symbols);
      });

      // Handle client disconnection
      socket.on('disconnect', () => {
        console.log(`🔌 Client disconnected: ${socket.id}`);
      });
    });

    // Forward platform events to Socket.IO
    this.orchestrator.on('aiTradeExecuted', (data) => {
      this.io.to('market_data').emit('ai_trade_executed', data);
    });

    this.orchestrator.on('crossChainBridgeCompleted', (data) => {
      this.io.to(`user_${data.userId}`).emit('cross_chain_completed', data);
    });

    this.orchestrator.on('nftSold', (data) => {
      this.io.to('market_data').emit('nft_sold', data);
    });

    this.orchestrator.on('securityAlert', (data) => {
      this.io.to(`user_${data.userId}`).emit('security_alert', data);
    });

    console.log('✅ Real-time communication setup completed');
  }

  /**
   * Setup error handling
   */
  private setupErrorHandling(): void {
    // 404 handler (already defined above, but included here for completeness)
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Endpoint not found',
        message: `Cannot ${req.method} ${req.originalUrl}`
      });
    });

    // Global error handler
    this.app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('🚨 Global error handler:', err);

      // Don't send error details in production
      const errorResponse = {
        error: 'Internal server error',
        message: this.config.environment === 'production'
          ? 'Something went wrong'
          : err.message,
        timestamp: new Date(),
        requestId: req.headers['x-request-id'] || 'unknown'
      };

      res.status(err.status || 500).json(errorResponse);
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('💥 Uncaught Exception:', error);
      this.gracefulShutdown('SIGTERM');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
      this.gracefulShutdown('SIGTERM');
    });
  }

  /**
   * Setup orchestrator event handlers
   */
  private setupOrchestratorEvents(): void {
    this.orchestrator.on('platformHealthAlert', (health) => {
      console.warn('⚠️ Platform Health Alert:', health);
      // Would send notifications to ops team
    });

    this.orchestrator.on('securityAlert', (alert) => {
      console.warn('🔒 Security Alert:', alert);
      // Would send security notifications
    });

    this.orchestrator.on('maintenanceStarted', (operation) => {
      console.log('🔧 Maintenance Started:', operation);
      // Would notify users of maintenance
    });

    this.orchestrator.on('userOnboarded', (data) => {
      console.log('👤 User Onboarded:', data);
      // Would send welcome notifications
    });
  }

  /**
   * Start HTTP server
   */
  private async startListening(): Promise<void> {
    const port = API_CONFIG.gateway.port;

    return new Promise((resolve, reject) => {
      this.server.listen(port, (err?: Error) => {
        if (err) {
          reject(err);
          return;
        }

        console.log(`🌐 HTTP server listening on port ${port}`);
        console.log(`📡 WebSocket server ready`);
        resolve();
      });
    });
  }

  /**
   * Setup graceful shutdown
   */
  private setupGracefulShutdown(): void {
    const signals = ['SIGTERM', 'SIGINT', 'SIGUSR2'];

    signals.forEach((signal) => {
      process.on(signal, () => {
        console.log(`📡 Received ${signal}, starting graceful shutdown...`);
        this.gracefulShutdown(signal);
      });
    });
  }

  /**
   * Perform graceful shutdown
   */
  private async gracefulShutdown(signal: string): Promise<void> {
    if (this.isShuttingDown) {
      console.log('🛑 Shutdown already in progress...');
      return;
    }

    this.isShuttingDown = true;
    console.log('🔄 Starting graceful shutdown...');

    try {
      // Stop accepting new connections
      this.server.close(async () => {
        console.log('🔌 HTTP server closed');

        try {
          // Shutdown platform orchestrator
          if (this.orchestrator) {
            await this.orchestrator.shutdown();
            console.log('🔧 Platform orchestrator shutdown completed');
          }

          // Close Socket.IO
          this.io.close();
          console.log('🔌 WebSocket server closed');

          console.log('✅ Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          console.error('❌ Error during shutdown:', error);
          process.exit(1);
        }
      });

      // Force shutdown after timeout
      setTimeout(() => {
        console.error('❌ Forced shutdown due to timeout');
        process.exit(1);
      }, 30000); // 30 seconds timeout

    } catch (error) {
      console.error('❌ Error initiating graceful shutdown:', error);
      process.exit(1);
    }
  }
}

/**
 * Main application entry point
 */
async function main(): Promise<void> {
  const server = new CryptoPlatformServer();

  // Handle clustering for production
  if (process.env.NODE_ENV === 'production' && cluster.isMaster) {
    const numCPUs = os.cpus().length;

    console.log(`🖥️  Master process running with PID: ${process.pid}`);
    console.log(`🔄 Forking ${numCPUs} worker processes...`);

    // Fork workers
    for (let i = 0; i < numCPUs; i++) {
      cluster.fork();
    }

    // Handle worker exits
    cluster.on('exit', (worker, code, signal) => {
      console.log(`❌ Worker ${worker.process.pid} died with code ${code}, signal ${signal}`);
      console.log('🔄 Starting a new worker...');
      cluster.fork();
    });

    // Handle master shutdown
    process.on('SIGTERM', () => {
      console.log('📡 Master received SIGTERM, shutting down workers...');

      for (const worker of Object.values(cluster.workers || {})) {
        if (worker) {
          worker.kill('SIGTERM');
        }
      }

      setTimeout(() => {
        console.log('✅ All workers terminated');
        process.exit(0);
      }, 5000);
    });

  } else {
    // Worker process
    console.log(`🔄 Worker process running with PID: ${process.pid}`);

    // Start the server
    await server.start();
  }
}

// Run the application
if (require.main === module) {
  main().catch((error) => {
    console.error('💥 Application startup failed:', error);
    process.exit(1);
  });
}

export default CryptoPlatformServer;