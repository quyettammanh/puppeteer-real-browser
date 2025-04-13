/**
 * Queue Service
 * Manages the queue of registration links and processes them
 */
const { createLogger } = require('../utils/logger');
const browserManager = require('../browser/browserManager');
const userManager = require('./userManager');
const registrationManager = require('../browser/registrationManager');

const logger = createLogger('QueueService');

// Queue configuration
const MAX_CONCURRENT_BROWSERS = 5;
let maxQueueSize = 50;
let registrationQueue = [];
let skippedLinksCount = 0;
let availableProxies = [];
let isProcessing = false;
let sequentialMode = true; // Flag to enable sequential processing
let processedLinks = new Set(); // Track processed links
let activeLinks = new Set(); // Track links currently being processed

// Browser cooldown system to prevent ECONNREFUSED errors
let BROWSER_COOLDOWN_MS = 5000; // 5 seconds cooldown between browser launches
let lastBrowserCloseTime = 0;

// User availability cooldown to prevent rapid retries when no users available
let USER_COOLDOWN_MS = 60000; // 1 minute cooldown when no users are available
let lastUserCheckTime = 0;
let noUsersAvailable = false;

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
    
    // Add to queue with unique id
    const taskId = `${examCode}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    registrationQueue.push({
      id: taskId,
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
    // Process as many tasks as we can up to MAX_CONCURRENT_BROWSERS
    await processMultipleTasks();
  } catch (error) {
    logger.error(`Error processing queue: ${error.message}`, error);
  } finally {
    isProcessing = false;
    logger.info(`Queue processing finished. ${registrationQueue.length} items remain.`);
  }
}

/**
 * Check if browser cooldown period has passed
 * @returns {boolean} Whether it's safe to launch a new browser
 */
function isBrowserCooldownComplete() {
  const timeSinceLastClose = Date.now() - lastBrowserCloseTime;
  return timeSinceLastClose >= BROWSER_COOLDOWN_MS;
}

/**
 * Update the last browser close time
 */
function updateBrowserCloseTime() {
  lastBrowserCloseTime = Date.now();
  logger.info(`Browser cooldown started. Next browser launch after ${BROWSER_COOLDOWN_MS}ms`);
}

/**
 * Check if user cooldown period has passed
 * @returns {boolean} Whether it's safe to check for users again
 */
function isUserCooldownComplete() {
  const timeSinceLastCheck = Date.now() - lastUserCheckTime;
  return timeSinceLastCheck >= USER_COOLDOWN_MS;
}

/**
 * Update the no users available status
 * @param {boolean} status - Whether users are unavailable
 */
function updateUserAvailability(status) {
  if (status === true && !noUsersAvailable) {
    // First time we detect no users available
    noUsersAvailable = true;
    lastUserCheckTime = Date.now();
    logger.warn(`No users available. Cooldown started. Will try again in ${USER_COOLDOWN_MS/1000} seconds.`);
  } else if (status === false) {
    // Users became available again
    noUsersAvailable = false;
  }
}

/**
 * Process multiple tasks up to MAX_CONCURRENT_BROWSERS
 */
async function processMultipleTasks() {
  // Check how many more browsers we can launch
  const activeBrowserCount = browserManager.getActiveBrowserCount();
  const availableSlots = MAX_CONCURRENT_BROWSERS - activeBrowserCount;
  
  if (availableSlots <= 0) {
    logger.info(`Maximum browser count reached (${activeBrowserCount}/${MAX_CONCURRENT_BROWSERS}). Waiting...`);
    // Wait for browser to become available and then retry
    setTimeout(() => {
      isProcessing = false;
      processQueue();
    }, 10000); // Check again after 10 seconds
    return;
  }
  
  // Check if we need to wait for browser cooldown
  if (!isBrowserCooldownComplete()) {
    const waitTime = BROWSER_COOLDOWN_MS - (Date.now() - lastBrowserCloseTime);
    logger.info(`Browser cooldown in progress. Waiting ${waitTime}ms before launching new browser.`);
    setTimeout(() => {
      isProcessing = false;
      processQueue();
    }, waitTime);
    return;
  }
  
  // Check if we're in user cooldown period
  if (noUsersAvailable && !isUserCooldownComplete()) {
    const waitTime = USER_COOLDOWN_MS - (Date.now() - lastUserCheckTime);
    logger.info(`User cooldown in progress. Waiting ${waitTime}ms before checking for users again.`);
    setTimeout(() => {
      isProcessing = false;
      processQueue();
    }, waitTime);
    return;
  }
  
  // If we were in user cooldown and the time has passed, reset the flag
  if (noUsersAvailable && isUserCooldownComplete()) {
    logger.info("User cooldown period has passed. Checking for users again.");
    noUsersAvailable = false;
  }
  
  // Process tasks up to available slots
  const tasksToProcess = Math.min(availableSlots, registrationQueue.length);
  logger.info(`Processing ${tasksToProcess} tasks with ${availableSlots} available browser slots`);
  
  // Keep track of user unavailability in this batch
  let userUnavailabilityCount = 0;
  
  for (let i = 0; i < tasksToProcess; i++) {
    // Get the next task
    const registrationTask = registrationQueue.shift();
    
    if (!registrationTask) continue;
    
    // Add to active links
    activeLinks.add(registrationTask.id);
    
    // Get proxy to use
    const proxy = getNextProxy();
    
    // Get a user for this registration
    const user = await userManager.getNextUserForExam(
      registrationTask.examCode, 
      registrationTask.modules
    );
    
    if (!user) {
      userUnavailabilityCount++;
      logger.warn(`No available user for exam ${registrationTask.examCode} with modules ${registrationTask.modules}. Keeping task for later.`);
      
      // Return the task to the queue for later processing
      registrationQueue.push(registrationTask);
      
      // Remove from active links
      activeLinks.delete(registrationTask.id);
      continue;
    }
    
    logger.info(`Found user ${user.email} for exam ${registrationTask.examCode} with modules ${registrationTask.modules}`);
    
    // Process the registration asynchronously
    processRegistrationTask(registrationTask, user, proxy).catch(error => {
      logger.error(`Error in registration task: ${error.message}`, error);
      
      // Put the task back in queue if it failed
      if (!processedLinks.has(registrationTask.id)) {
        registrationQueue.push(registrationTask);
      }
      
      // Remove from active links
      activeLinks.delete(registrationTask.id);
    });
    
    // Wait before processing next task to prevent connection issues
    if (i < tasksToProcess - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // Check if all tasks in this batch had no users available
  if (userUnavailabilityCount > 0 && userUnavailabilityCount === tasksToProcess) {
    // All tasks had no users available, trigger cooldown
    updateUserAvailability(true);
    
    // If we're in user cooldown, wait longer before trying again
    setTimeout(() => {
      isProcessing = false;
      processQueue();
    }, USER_COOLDOWN_MS);
    return;
  }
  
  // If we still have tasks and slots, continue processing
  if (registrationQueue.length > 0 && browserManager.getActiveBrowserCount() < MAX_CONCURRENT_BROWSERS) {
    setTimeout(() => {
      isProcessing = false;
      processQueue();
    }, 2000);
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
    // Try to launch browser with retries
    let browser, page, browserId;
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        // Launch a browser instance
        const result = await browserManager.launchBrowser(null, proxy);
        browser = result.browser;
        page = result.page;
        browserId = result.browserId;
        break; // Success, exit the retry loop
      } catch (err) {
        retryCount++;
        logger.warn(`Browser launch attempt ${retryCount}/${maxRetries} failed: ${err.message}`);
        
        if (retryCount >= maxRetries) {
          throw new Error(`Failed to launch browser after ${maxRetries} attempts`);
        }
        
        // Wait exponentially longer between retries
        const waitTime = 2000 * Math.pow(2, retryCount);
        logger.info(`Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    // Process URL to extract cookies if present
    const { processLinkWithCookies } = require('../browser/registrationManager');
    const { url, cookies } = processLinkWithCookies(task.link);
    
    // Log the extracted information
    logger.info(`Extracted URL: ${url || task.link}`);
    logger.info(`Extracted ${cookies.length} cookies from link`);
    
    // Apply cookies to the page if any were extracted
    if (cookies && cookies.length > 0) {
      await applyCookiesToPage(page, cookies, url || task.link);
    }
    
    // Define callback for when registration completes
    const onCompleteCallback = () => {
      // Mark task as processed
      processedLinks.add(task.id);
      activeLinks.delete(task.id);
      
      // Update browser close time for cooldown
      updateBrowserCloseTime();
      
      // Check if we can process more tasks after cooldown
      setTimeout(() => {
        if (registrationQueue.length > 0 && browserManager.getActiveBrowserCount() < MAX_CONCURRENT_BROWSERS) {
          isProcessing = false;
          processQueue();
        }
      }, BROWSER_COOLDOWN_MS); // Wait for cooldown period
    };
    
    // Start the registration process with the clean URL
    await registrationManager.startRegistration(
      browser,
      page,
      url || task.link, // Use the extracted URL if available, otherwise use original
      user,
      task.examCode,
      browserId,
      onCompleteCallback
    );
    
    // Browser will be closed inside the registration manager
    return true;
  } catch (error) {
    logger.error(`Failed to process registration task for ${user.email}: ${error.message}`, error);
    throw error;
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
 * Toggle between sequential and concurrent processing modes
 * @param {boolean} enabled - Whether to enable sequential mode
 */
function setSequentialMode(enabled = true) {
  sequentialMode = enabled;
  logger.info(`Sequential processing mode ${enabled ? 'enabled' : 'disabled'}`);
}

/**
 * Set browser cooldown time
 * @param {number} ms - Cooldown time in milliseconds
 */
function setBrowserCooldown(ms) {
  if (typeof ms === 'number' && ms >= 0) {
    BROWSER_COOLDOWN_MS = ms;
    logger.info(`Browser cooldown time set to ${ms}ms`);
  }
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

/**
 * Get number of active tasks
 * @returns {number} Active task count
 */
function getActiveTaskCount() {
  return activeLinks.size;
}

/**
 * Set user cooldown time
 * @param {number} ms - Cooldown time in milliseconds
 */
function setUserCooldown(ms) {
  if (typeof ms === 'number' && ms >= 0) {
    USER_COOLDOWN_MS = ms;
    logger.info(`User cooldown time set to ${ms}ms`);
  }
}

module.exports = {
  initQueue,
  addToQueue,
  processQueue,
  getQueueLength,
  getMaxQueueSize,
  getSkippedLinksCount,
  getActiveTaskCount,
  setSequentialMode,
  setBrowserCooldown,
  setUserCooldown
}; 