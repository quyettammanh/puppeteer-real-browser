/**
 * Goethe Registration System - Main Entry Point
 * Coordinates all services and manages the application lifecycle
 */
const path = require('path');
const config = require('./config/env');
const { createLogger } = require('./utils/logger');
const redisService = require('./services/redisService');
const queueService = require('./services/queueService');
const proxyService = require('./utils/proxyService');
const browserManager = require('./browser/browserManager');

const logger = createLogger('Main');

// Start the application
(async () => {
  logger.info('Starting Goethe Registration System v2');
  
  // Initialize Redis
  logger.info('Initializing Redis connection...');
  const redisInitialized = await redisService.initRedis();
  if (!redisInitialized) {
    logger.error('Failed to initialize Redis. Exiting...');
    process.exit(1);
  }
  
  // Load proxies
  logger.info('Loading proxies...');
  const pathProxy = path.join(process.cwd(), 'data/proxy/proxy.txt');
  const listProxies = proxyService.loadProxiesFromFile(pathProxy);
  if (!listProxies || listProxies.length === 0) {
    logger.warn('No proxies found. Will continue without proxies.');
  } else {
    logger.info(`Loaded ${listProxies.length} proxies`);
  }
  
  // Initialize the queue system
  logger.info('Initializing queue system...');
  queueService.initQueue(listProxies);
  
  // Enable sequential processing mode by default (one link at a time)
  logger.info('Enabling sequential processing mode (one link at a time)');
  queueService.setSequentialMode(true);
  
  // Set browser cooldown period to avoid ECONNREFUSED errors
  logger.info('Setting browser cooldown period to 8 seconds');
  queueService.setBrowserCooldown(8000);
  
  // Set user cooldown period to prevent rapid loops when no users are available
  logger.info('Setting user unavailability cooldown period to 2 minutes');
  queueService.setUserCooldown(120000); // 2 minutes
  
  // Subscribe to Redis channel for registration links
  logger.info(`Subscribing to Redis channel: ${config.redis.registerChannel}`);
  await redisService.subscribeToRegistrationLinks((link, examCode, modules, date) => {
    // Reconstruct message and add it to the queue
    const message = `${link}@${examCode}@${modules}@${date}`;
    queueService.addToQueue(message);
  });
  
  logger.info('System is ready and waiting for registration links');
  
  // Optional: Process an initial URL for testing
  if (config.initial.registerUrl) {
    logger.info(`Processing initial test URL: ${config.initial.registerUrl}`);
    const initialMessage = `${config.initial.registerUrl}@${config.initial.exam}@${config.initial.modules}@${config.initial.date}`;
    queueService.addToQueue(initialMessage);
  }
  
  // Set up regular status reporting
  setInterval(() => {
    const queueLength = queueService.getQueueLength();
    const activeBrowsers = browserManager.getActiveBrowserCount();
    const maxQueueSize = queueService.getMaxQueueSize();
    const skippedLinks = queueService.getSkippedLinksCount();
    const activeTasks = queueService.getActiveTaskCount();
    
    logger.info(`Status: Queue ${queueLength}/${maxQueueSize}, Active Tasks ${activeTasks}, Browsers ${activeBrowsers}, Skipped ${skippedLinks}`);
    
    // Check and restart queue processing if there are items in queue but no active processing
    if (queueLength > 0 && activeBrowsers < browserManager.getMaxBrowserLimit()) {
      logger.info('Detected items in queue with available browser slots. Restarting queue processing.');
      // Force queue restart
      queueService.processQueue();
    }
  }, 60000); // Report status every minute
  
  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    logger.info('Received SIGINT. Gracefully shutting down...');
    
    // Close all active browsers
    await browserManager.closeAllBrowsers();
    
    // Close Redis connections
    await redisService.closeRedis();
    
    logger.info('Shutdown complete. Exiting...');
    process.exit(0);
  });
})(); 