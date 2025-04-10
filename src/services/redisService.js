/**
 * Redis Service
 * Handles all Redis operations including pub/sub
 */
const { createClient } = require('redis');
const config = require('../config/env');
const { createLogger } = require('../utils/logger');

const logger = createLogger('RedisService');
let redisClient = null;
let subscriber = null;

/**
 * Initialize Redis connection
 * @returns {Promise<void>}
 */
async function initRedis() {
  try {
    // Create Redis client
    redisClient = createClient({
      url: `redis://${config.redis.host}:${config.redis.port}`
    });
    
    // Handle connection errors
    redisClient.on('error', (err) => {
      logger.error(`Redis client error: ${err.message}`, err);
    });
    
    // Connect to Redis
    await redisClient.connect();
    logger.info(`Connected to Redis at ${config.redis.host}:${config.redis.port}`);
    
    // Create subscriber client
    subscriber = redisClient.duplicate();
    await subscriber.connect();
    logger.info('Redis subscriber connected');
    
    return true;
  } catch (error) {
    logger.error(`Failed to connect to Redis: ${error.message}`, error);
    return false;
  }
}

/**
 * Subscribe to registration links channel
 * @param {Function} callback - Function to call when a message is received
 * @returns {Promise<boolean>} Success status
 */
async function subscribeToRegistrationLinks(callback) {
  if (!subscriber) {
    logger.error('Cannot subscribe: Redis not initialized');
    return false;
  }
  
  try {
    const channel = config.redis.registerChannel;
    logger.info(`Subscribing to channel: ${channel}`);
    
    await subscriber.subscribe(channel, (message) => {
      logger.info(`Received message from Redis channel ${channel}`);
      
      try {
        // Parse the message format: link@examCode@modules@date
        const parts = message.split('@');
        if (parts.length >= 4) {
          const [link, examCode, modules, date] = parts;
          callback(link, examCode, modules, date);
        } else {
          logger.warn(`Invalid message format received: ${message}`);
        }
      } catch (error) {
        logger.error(`Error processing Redis message: ${error.message}`, error);
      }
    });
    
    logger.info(`Successfully subscribed to ${channel}`);
    return true;
  } catch (error) {
    logger.error(`Failed to subscribe to channel: ${error.message}`, error);
    return false;
  }
}

/**
 * Close Redis connections
 * @returns {Promise<void>}
 */
async function closeRedis() {
  try {
    if (subscriber) {
      await subscriber.quit();
      logger.info('Redis subscriber disconnected');
    }
    
    if (redisClient) {
      await redisClient.quit();
      logger.info('Redis client disconnected');
    }
  } catch (error) {
    logger.error(`Error closing Redis connections: ${error.message}`, error);
  }
}

module.exports = {
  initRedis,
  subscribeToRegistrationLinks,
  closeRedis
}; 