const { processRegistration } = require('./registrationUtils.js');
const { parseExamCode } = require('./examUtils.js');
const { getNextUser, returnUserToPool, getAvailableUserCount, isUserActive, trackActiveUser, isUserOnCooldown, debugActiveUsers, releaseActiveUser, setUserOnCooldown } = require('./userPool.js');
const { extractCookies } = require('./link_cookies.js');
const { getSortedUsersByModules, getRequiredSkills } = require('./userSorter.js');

// Queue of pending registration links
const linkQueue = [];

// Maximum number of concurrent browsers
const MAX_CONCURRENT_BROWSERS = 10;

// Maximum size for the queue to prevent memory issues
const MAX_QUEUE_SIZE = 25;

// Maximum time (in milliseconds) for browser to run before forced close
const BROWSER_TIMEOUT = 15 * 60 * 1000; // 15 minutes

// Counter for active browsers
let activeBrowserCount = 0;

// Counter for skipped links
let skippedLinksCount = 0;

// Flag to indicate if queue processing is already in progress
let isProcessingQueue = false;

// Store proxies to be used across function calls
let globalProxies = [];

// Store cookies by link to avoid extracting them multiple times
const cookiesCache = new Map();

// Store retry counters
const retryCounters = new Map();

// Maximum number of retries
const MAX_RETRIES = 1;

// Delay between retries
const RETRY_DELAY = 1000; // 1 second

/**
 * Initialize the queue system with proxies
 * @param {Array} proxies - List of available proxies
 */
function initQueue(proxies) {
  globalProxies = proxies;
  console.log(`Queue system initialized with ${proxies.length} proxies`);
}

/**
 * Add a registration link to the queue
 * @param {string} message - Registration message in format "link@examCode@modules@date"
 * @returns {boolean} - Whether the link was added to the queue or skipped
 */
function addToQueue(message) {
  // Check if queue is already at maximum capacity
  if (linkQueue.length >= MAX_QUEUE_SIZE) {
    skippedLinksCount++;
    // Log overload status only periodically to avoid spamming logs
    if (skippedLinksCount % 5 === 0) {
      console.log(`⚠️ Queue is full (${linkQueue.length}/${MAX_QUEUE_SIZE}). Skipped ${skippedLinksCount} links.`);
    }
    return false;
  }
  
  // Add to queue if under limit
  linkQueue.push(message);
  console.log(`Added link to queue. Queue length: ${linkQueue.length}/${MAX_QUEUE_SIZE}`);
  
  // Attempt to process the queue
  tryProcessQueue();
  return true;
}

/**
 * Safely attempt to process the queue without overlapping executions
 */
function tryProcessQueue() {
  if (!isProcessingQueue) {
    isProcessingQueue = true;
    processQueue();
  } else {
    console.log('Queue processing already in progress, skipping this attempt');
  }
}

/**
 * Process items in the queue if we have capacity
 */
function processQueue() {
  try {
    // Check if we're already at max capacity
    if (activeBrowserCount >= MAX_CONCURRENT_BROWSERS) {
      console.log(`Already at maximum capacity (${activeBrowserCount}/${MAX_CONCURRENT_BROWSERS}). Waiting for browsers to complete.`);
      isProcessingQueue = false;
      return;
    }

    // Get all unique exam types from the queue
    const examTypesInQueue = new Set();
    for (const message of linkQueue) {
      const parts = message.split('@');
      if (parts.length >= 2) {
        const examCode = parts[1];
        const { location, level } = parseExamCode(examCode);
        if (location && level) {
          examTypesInQueue.add(`${location}_${level}`);
        }
      }
    }

    // Calculate available users across all exam types in queue
    let totalAvailableUsers = 0;
    for (const examKey of examTypesInQueue) {
      const [location, level] = examKey.split('_');
      const availableCount = getAvailableUserCount(location, level);
      totalAvailableUsers += availableCount;
    }

    // Use the lower of MAX_CONCURRENT_BROWSERS or totalAvailableUsers as the limit
    const effectiveLimit = Math.min(MAX_CONCURRENT_BROWSERS, totalAvailableUsers || MAX_CONCURRENT_BROWSERS);
    console.log(`Effective browser limit: ${effectiveLimit} (Available users: ${totalAvailableUsers}, Max browsers: ${MAX_CONCURRENT_BROWSERS}, Current: ${activeBrowserCount})`);

    // If we're already at the effective limit, don't process any more links
    if (activeBrowserCount >= effectiveLimit) {
      console.log(`At effective capacity (${activeBrowserCount}/${effectiveLimit}) with ${linkQueue.length} links waiting`);
      isProcessingQueue = false;
      return;
    }

    // Continue processing while there are items and capacity
    while (linkQueue.length > 0 && activeBrowserCount < effectiveLimit) {
      if (!globalProxies || globalProxies.length === 0) {
        console.error('No proxies available for processing queue');
        break;
      }
      
      // Get next link from queue
      const message = linkQueue.shift();
      console.log(`Processing link from queue. Queue length: ${linkQueue.length}/${MAX_QUEUE_SIZE}`);
      
      // Process the link
      processLink(message, globalProxies)
        .catch(error => {
          console.error('Error processing link:', error);
        });
    }
    
    if (linkQueue.length > 0 && activeBrowserCount >= effectiveLimit) {
      console.log(`At max capacity (${activeBrowserCount}/${effectiveLimit}) with ${linkQueue.length} links waiting`);
    } else if (linkQueue.length === 0) {
      console.log('Queue is empty');
    }
  } finally {
    // Reset processing flag
    isProcessingQueue = false;
  }
}

/**
 * Process a single link
 * @param {string} message - Registration message in format "link@examCode@modules@date"
 * @param {Array} proxies - List of available proxies
 * @returns {Promise<void>}
 */
async function processLink(message, proxies) {
  activeBrowserCount++;
  console.log("running async function processLink(message, proxies)");
  
  let user = null;
  let browserTimeout = null;
  let location = null; // Define location and level here to be accessible in finally
  let level = null;
  
  try {
    // Parse the message
    const parts = message.split('@');
    
    if (parts.length < 4) {
      throw new Error(`Invalid message format. Expected "link@examCode@modules@date", got: ${message}`);
    }
    
    const link = parts[0];
    const examCode = parts[1];
    const modules = parts[2];
    const date = parts[3];
    
    // Check if cookies are already in cache
    let cookies = cookiesCache.get(link);
    
    // If not in cache, extract them and cache for future use
    if (!cookies) {
      cookies = await extractCookies(link);
      if (cookies) {
        cookiesCache.set(link, cookies);
        console.log(`Extracted and cached cookies from link: ${cookies.substring(0, 50)}${cookies.length > 50 ? '...' : ''}`);
      } else {
        console.log(`No cookies found in the link or failed to extract cookies`);
      }
    } else {
      console.log(`Using cached cookies for link: ${cookies.substring(0, 50)}${cookies.length > 50 ? '...' : ''}`);
    }
    
    // Extract location and level from exam code
    const parsedExam = parseExamCode(examCode);
    location = parsedExam.location; // Assign to outer scope variables
    level = parsedExam.level;
    
    if (!location || !level) {
      throw new Error(`Could not parse location and level from exam code: ${examCode}`);
    }

    // Get the next available user directly from the pool manager
    user = await getNextUser(location, level);

    if (!user) {
      // Handle case where no user is available (active or on cooldown)
      console.log(`No available users found for ${location}_${level} at the moment.`);
      // Re-add the message to the queue with a delay
      console.log(`Re-adding message to queue due to no available users`);
      setTimeout(() => {
          const retryKey = `retry_${message}`;
          const retryCount = retryCounters.get(retryKey) || 0;
          
          if (retryCount < MAX_RETRIES) {
              retryCounters.set(retryKey, retryCount + 1);
              linkQueue.push(message);
              console.log(`Retry ${retryCount + 1}/${MAX_RETRIES} for message due to no available users`);
          } else {
              console.log(`Maximum retries (${MAX_RETRIES}) reached for message, dropping: ${message}`);
              retryCounters.delete(retryKey); // Clean up retry counter
          }
      }, RETRY_DELAY);
      // Decrement browser count as we didn't actually start processing
      activeBrowserCount--; 
      console.log(`Browser count decremented due to no user. Active browsers: ${activeBrowserCount}/${MAX_CONCURRENT_BROWSERS}`);
      // Trigger queue processing again in case other links can be processed
      setTimeout(() => tryProcessQueue(), 100); 
      return; // Exit this processing attempt
    }
    
    // User is already marked active by getNextUser, no need to call trackActiveUser here

    // Get required skills for this user (Assuming this function is still needed and works with the user object)
    const requiredSkills = getRequiredSkills(user, modules);
    
    // Log user and required skills
    console.log(`Selected user: ${user.email} for ${location}_${level}`);
    console.log(`Required skills: ${requiredSkills.join(', ')}`);
    
    // Select a random proxy
    const proxy = proxies[Math.floor(Math.random() * proxies.length)];
    
    // Generate a unique browser ID for this instance
    const browserId = `browser-${Math.random().toString(36).substring(2, 8)}`;
    
    console.log(`Starting registration for ${user.email} with browser ID ${browserId}`);
    
    // Set a timeout to forcibly close the browser if it takes too long
    browserTimeout = setTimeout(() => {
      console.warn(`Browser timeout reached for ${browserId}. Force closing.`);
      processRegistration(link, examCode, modules, date, user, proxy, browserId, cookies, true)
        .catch(error => {
          console.error(`Error force closing browser ${browserId}:`, error);
        });
    }, BROWSER_TIMEOUT);
    
    // Process the registration
    await processRegistration(link, examCode, modules, date, user, proxy, browserId, cookies);
    console.log(`Registration completed for ${user.email}`);
    
  } catch (error) {
    console.error(`Error in processLink: ${error.message}`);
    
    // If we failed due to no users, put the message back in queue with a delay
    if (error.message && error.message.includes('No users available')) {
      console.log(`Re-adding message to queue due to no available users`);
      setTimeout(() => {
        const retryKey = `retry_${message}`;
        const retryCount = retryCounters.get(retryKey) || 0;
        
        if (retryCount < MAX_RETRIES) {
          retryCounters.set(retryKey, retryCount + 1);
          linkQueue.push(message);
          console.log(`Retry ${retryCount + 1}/${MAX_RETRIES} for message due to no available users`);
        } else {
          console.log(`Maximum retries (${MAX_RETRIES}) reached for message, dropping: ${message}`);
        }
      }, RETRY_DELAY);
    }
  } finally {
    if (browserTimeout) {
      clearTimeout(browserTimeout);
    }
    
    if (user) {
      // Use the location and level derived from the message, not user.examCode
      if (location && level) {
        returnUserToPool(user, location, level);
        
        // Debug active users after returning to pool
        console.log("Active users after returning user to pool:");
        debugActiveUsers();
      } else {
         // This case should ideally not happen if we got a user, but good to log
         console.warn(`Could not determine location/level to return user ${user.email} to pool.`);
         // Fallback: attempt to release the user anyway without returning to a specific pool's available list
         releaseActiveUser(user); 
         setUserOnCooldown(user); // Still apply cooldown
      }
    }
    
    activeBrowserCount--;
    console.log(`Browser completed. Active browsers: ${activeBrowserCount}/${MAX_CONCURRENT_BROWSERS}`);
    
    setTimeout(() => tryProcessQueue(), 1000);
  }
}

/**
 * Get the current queue length
 * @returns {number} - Number of links in queue
 */
function getQueueLength() {
  return linkQueue.length;
}

/**
 * Get the maximum queue size
 * @returns {number} - Maximum queue size
 */
function getMaxQueueSize() {
  return MAX_QUEUE_SIZE;
}

/**
 * Get the number of skipped links due to queue being full
 * @returns {number} - Number of skipped links
 */
function getSkippedLinksCount() {
  return skippedLinksCount;
}

/**
 * Get the current number of active browsers
 * @returns {number} - Number of active browsers
 */
function getActiveBrowserCount() {
  return activeBrowserCount;
}

/**
 * Clear the queue
 */
function clearQueue() {
  const count = linkQueue.length;
  linkQueue.length = 0;
  console.log(`Cleared ${count} links from queue`);
}

/**
 * Set the maximum number of concurrent browsers
 * @param {number} max - Maximum number of browsers
 */
function setMaxConcurrentBrowsers(max) {
  if (typeof max === 'number' && max > 0) {
    MAX_CONCURRENT_BROWSERS = max;
    console.log(`Set maximum concurrent browsers to ${MAX_CONCURRENT_BROWSERS}`);
    
    // Try to process queue in case the limit was increased
    tryProcessQueue();
  } else {
    console.error(`Invalid maximum concurrent browsers value: ${max}`);
  }
}

module.exports = {
  initQueue,
  addToQueue,
  processQueue,
  getQueueLength,
  getMaxQueueSize,
  getSkippedLinksCount,
  getActiveBrowserCount,
  clearQueue,
  setMaxConcurrentBrowsers
}; 