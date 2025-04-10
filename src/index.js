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
    
    logger.info(`Status: Queue ${queueLength}/${maxQueueSize}, Browsers ${activeBrowsers}, Skipped ${skippedLinks}`);
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