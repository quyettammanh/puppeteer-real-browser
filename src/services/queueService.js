/**
 * Queue Service
 * Manages the queue of registration links and processes them
 */
const { createLogger } = require('../utils/logger');
const browserManager = require('../browser/browserManager');
const userManager = require('./userManager');
const registrationManager = require('../register/registrationManager');

const logger = createLogger('QueueService');

// Queue configuration
const MAX_CONCURRENT_BROWSERS = 20;
let maxQueueSize = 50;
let registrationQueue = [];
let skippedLinksCount = 0;
let availableProxies = [];
let isProcessing = false;

/**
 * Initialize the queue service
 * @param {Array<string>} proxies - List of proxies to use
 * @param {number} maxBrowsers - Maximum number of concurrent browsers (default: 10)
 * @param {number} queueSize - Maximum queue size (default: 50)
 */
function initQueue(proxies = [], maxBrowsers = MAX_CONCURRENT_BROWSERS, queueSize = 50) {
  availableProxies = [...proxies];
  maxQueueSize = queueSize;
  logger.info(`Queue initialized with ${availableProxies.length} proxies, max browsers: ${maxBrowsers}, queue size: ${maxQueueSize}`);
}

/**
 * Add a registration task to the queue
 * @param {string} message - Message in format "link@examCode@modules@date"
 * @returns {boolean} Success status
 */
function addToQueue(message) {
  // Check if queue is full
  if (registrationQueue.length >= maxQueueSize) {
    logger.warn(`Queue is full (${registrationQueue.length}/${maxQueueSize}). Skipping link.`);
    skippedLinksCount++;
    return false;
  }
  
  // Parse the message
  try {
    const parts = message.split('@');
    if (parts.length < 4) {
      logger.error(`Invalid message format: ${message}`);
      return false;
    }
    
    const [link, examCode, modules, date] = parts;
    
    // Add to queue
    registrationQueue.push({
      link,
      examCode,
      modules,
      date,
      timestamp: Date.now()
    });
    
    logger.info(`Added to queue: ${examCode} modules [${modules}] (Queue size: ${registrationQueue.length}/${maxQueueSize})`);
    
    // Start processing if not already running
    if (!isProcessing) {
      processQueue();
    }
    
    return true;
  } catch (error) {
    logger.error(`Error adding to queue: ${error.message}`, error);
    return false;
  }
}

/**
 * Process items in the queue
 */
async function processQueue() {
  if (isProcessing || registrationQueue.length === 0) {
    return;
  }
  
  isProcessing = true;
  logger.info(`Started queue processing (${registrationQueue.length} items)`);
  
  try {
    while (registrationQueue.length > 0) {
      // Check if we have reached the browser limit
      const activeBrowserCount = browserManager.getActiveBrowserCount();
      if (activeBrowserCount >= MAX_CONCURRENT_BROWSERS) {
        logger.info(`Maximum browser count reached (${activeBrowserCount}/${MAX_CONCURRENT_BROWSERS}). Waiting...`);
        isProcessing = false;
        return;
      }
      
      // Get the next item from the queue
      const registrationTask = registrationQueue.shift();
      
      // Get proxy to use
      const proxy = getNextProxy();
      
      // Get a user for this registration - pass modules from task
      const user = await userManager.getNextUserForExam(
        registrationTask.examCode, 
        registrationTask.modules
      );
      
      if (!user) {
        logger.warn(`No available user for exam ${registrationTask.examCode} with modules ${registrationTask.modules}. Skipping task.`);
        continue;
      }
      
      logger.info(`Found user ${user.email} for exam ${registrationTask.examCode} with modules ${registrationTask.modules}`);
      
      // Process the registration asynchronously
      processRegistrationTask(registrationTask, user, proxy).catch(error => {
        logger.error(`Error in registration task: ${error.message}`, error);
      });
    }
  } catch (error) {
    logger.error(`Error processing queue: ${error.message}`, error);
  } finally {
    isProcessing = false;
    logger.info(`Queue processing finished. ${registrationQueue.length} items remain.`);
  }
}

/**
 * Process a single registration task
 * @param {Object} task - Registration task
 * @param {Object} user - User data
 * @param {string} proxy - Proxy to use
 */
async function processRegistrationTask(task, user, proxy) {
  logger.info(`Processing registration for ${user.email} with exam ${task.examCode}`);
  
  try {
    // Launch a browser instance
    const { browser, page, browserId } = await browserManager.launchBrowser(proxy);
    
    // Process URL to extract cookies if present
    const { processLinkWithCookies } = require('../register/registrationManager');
    const { url, cookies } = processLinkWithCookies(task.link);
    
    // Log the extracted information
    logger.info(`Extracted URL: ${url || task.link}`);
    logger.info(`Extracted ${cookies.length} cookies from link`);
    
    // Apply cookies to the page if any were extracted
    if (cookies && cookies.length > 0) {
      await applyCookiesToPage(page, cookies, url || task.link);
    }
    
    // Start the registration process with the clean URL
    await registrationManager.startRegistration(
      browser,
      page,
      url || task.link, // Use the extracted URL if available, otherwise use original
      user,
      task.examCode,
      browserId
    );
    
    // Note: Browser is closed inside the registration manager
  } catch (error) {
    logger.error(`Failed to process registration task for ${user.email}: ${error.message}`, error);
  }
}

/**
 * Apply cookies to a Puppeteer page
 * @param {Object} page - Puppeteer page
 * @param {Array} cookies - Array of cookie objects
 * @param {string} url - URL to associate with cookies
 * @returns {Promise<void>}
 */
async function applyCookiesToPage(page, cookies, url) {
  try {
    // Ensure cookies have all required fields for Puppeteer
    const formattedCookies = cookies.map(cookie => {
      // Parse the URL to get domain
      const urlObj = new URL(url);
      
      // Return a well-formed cookie object
      return {
        name: cookie.name,
        value: cookie.value,
        domain: cookie.domain || urlObj.hostname,
        path: cookie.path || '/',
        httpOnly: cookie.httpOnly !== undefined ? cookie.httpOnly : false,
        secure: cookie.secure !== undefined ? cookie.secure : urlObj.protocol === 'https:',
        sameSite: cookie.sameSite || 'Lax'
      };
    });
    
    // Set cookies on the page
    await page.setCookie(...formattedCookies);
    logger.info(`Successfully applied ${formattedCookies.length} cookies to page`);
  } catch (error) {
    logger.error(`Error applying cookies to page: ${error.message}`, error);
  }
}

/**
 * Get the next proxy in a round-robin fashion
 * @returns {string|null} Next proxy or null if none available
 */
function getNextProxy() {
  if (availableProxies.length === 0) {
    return null;
  }
  
  // Move the first proxy to the end of the array for round-robin
  const proxy = availableProxies.shift();
  availableProxies.push(proxy);
  
  return proxy;
}

/**
 * Get current queue length
 * @returns {number} Queue length
 */
function getQueueLength() {
  return registrationQueue.length;
}

/**
 * Get maximum queue size
 * @returns {number} Max queue size
 */
function getMaxQueueSize() {
  return maxQueueSize;
}

/**
 * Get number of skipped links
 * @returns {number} Skipped links count
 */
function getSkippedLinksCount() {
  return skippedLinksCount;
}

module.exports = {
  initQueue,
  addToQueue,
  processQueue,
  getQueueLength,
  getMaxQueueSize,
  getSkippedLinksCount
}; 