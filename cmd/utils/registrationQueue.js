const { processRegistration } = require('./registrationUtils.js');
const { parseExamCode } = require('./examUtils.js');
const { getNextUser, returnUserToPool } = require('./userPool.js');
const { extractCookies } = require('./link_cookies.js');

// Queue of pending registration links
const linkQueue = [];

// Maximum number of concurrent browsers
const MAX_CONCURRENT_BROWSERS = 6;

// Counter for active browsers
let activeBrowserCount = 0;

// Store proxies to be used across function calls
let globalProxies = [];

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
 */
function addToQueue(message) {
  linkQueue.push(message);
  console.log(`Added link to queue. Queue length: ${linkQueue.length}`);
  processQueue();
}

/**
 * Process the next item in the queue if we have capacity
 */
function processQueue() {
  if (linkQueue.length === 0) {
    console.log('No links in queue to process');
    return;
  }

  // If we're already at max capacity, don't start new registrations
  if (activeBrowserCount >= MAX_CONCURRENT_BROWSERS) {
    console.log(`Already at max capacity (${activeBrowserCount}/${MAX_CONCURRENT_BROWSERS}). Waiting for browsers to finish...`);
    return;
  }

  // Check if we have proxies available
  if (!globalProxies || globalProxies.length === 0) {
    console.error('No proxies available for processing queue');
    return;
  }

  // Get next link from queue
  const message = linkQueue.shift();
  console.log(`Processing next link from queue. ${linkQueue.length} links remaining.`);
  
  // Process the link
  processLink(message, globalProxies)
    .then(() => {
      console.log('Link processed successfully');
      // After processing, try to process more links if available
      processQueue();
    })
    .catch(error => {
      console.error('Error processing link:', error);
      // Even on error, try to process more links if available
      processQueue();
    });
}

/**
 * Process a single link
 * @param {string} message - Registration message in format "link@examCode@modules@date"
 * @param {Array} proxies - List of available proxies
 * @returns {Promise<void>}
 */
async function processLink(message, proxies) {
  try {
    // Parse the message
    const parts = message.split('@');
    
    if (parts.length < 4) {
      console.error(`Invalid message format. Expected "link@examCode@modules@date", got: ${message}`);
      return;
    }
    
    const link = parts[0];
    const examCode = parts[1];
    const modules = parts[2];
    const date = parts[3];
    
    // Extract cookies from the link if any
    const cookies = await extractCookies(link);
    if (cookies) {
      console.log(`Extracted cookies from link: ${cookies.substring(0, 50)}${cookies.length > 50 ? '...' : ''}`);
    } else {
      console.log(`No cookies found in the link or failed to extract cookies`);
    }
    
    // Extract location and level from exam code
    const { location, level } = parseExamCode(examCode);
    
    if (!location || !level) {
      console.error(`Could not parse location and level from exam code: ${examCode}`);
      return;
    }
    
    // Get an available user for this exam type
    const user = await getNextUser(location, level);
    if (!user) {
      console.log(`No users available for ${location} ${level}. Adding link back to queue.`);
      // Put the link back at the end of the queue for retry
      linkQueue.push(message);
      return;
    }
    
    // Select a random proxy
    const proxy = proxies[Math.floor(Math.random() * proxies.length)];
    
    // Generate a unique browser ID for this instance
    const browserId = `browser-${Math.random().toString(36).substring(2, 8)}`;
    
    console.log(`Starting registration for ${user.email} with browser ID ${browserId}`);
    
    // Increment active browser count
    activeBrowserCount++;
    console.log(`Active browsers: ${activeBrowserCount}/${MAX_CONCURRENT_BROWSERS}`);
    
    // Process the registration
    try {
      await processRegistration(link, examCode, modules, date, user, proxy, browserId, cookies);
    } finally {
      // Decrement active browser count when done
      activeBrowserCount--;
      console.log(`Browser completed. Active browsers: ${activeBrowserCount}/${MAX_CONCURRENT_BROWSERS}`);
      
      // Return the user to the pool
      returnUserToPool(user, location, level);
      
      // Process next item in queue if any
      setTimeout(() => processQueue(), 1000); // Add a small delay before processing next item
    }
  } catch (error) {
    console.error(`Error processing link: ${error.message}`);
    
    // Decrement active browser count in case of error
    activeBrowserCount--;
    console.log(`Browser errored. Active browsers: ${activeBrowserCount}/${MAX_CONCURRENT_BROWSERS}`);
    
    // Process next item in queue even if this one failed
    setTimeout(() => processQueue(), 1000);
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
    processQueue();
  } else {
    console.error(`Invalid maximum concurrent browsers value: ${max}`);
  }
}

module.exports = {
  initQueue,
  addToQueue,
  processQueue,
  getQueueLength,
  getActiveBrowserCount,
  clearQueue,
  setMaxConcurrentBrowsers
}; 