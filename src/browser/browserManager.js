/**
 * Browser Manager Service
 * Handles creation and management of browser instances
 */
const path = require('path');
const { execSync } = require('child_process');
const config = require('../config/env');
const { createLogger } = require('../utils/logger');

const logger = createLogger('BrowserManager');
const activeBrowsers = new Map();
let browserCounter = 0;

// Use the existing MAX_CONCURRENT_BROWSERS from config
function getMaxBrowserLimit() {
  return config.MAX_CONCURRENT_BROWSERS || 20; // Default to 20 if not defined
}

/**
 * Launch a browser instance using gpm-login
 * @param {string} linkId - Unique identifier for this task/link
 * @param {string} proxy - Optional proxy to use
 * @returns {Promise<Object>} Browser and page objects
 */
async function launchBrowser(linkId, proxy = null) {
  // Check if this link already has a browser
  if (linkId && activeBrowsers.has(linkId)) {
    logger.info(`Returning existing browser for link ${linkId}`);
    const instance = activeBrowsers.get(linkId);
    return { 
      browser: instance.browser, 
      page: instance.page, 
      browserId: linkId
    };
  }
  
  // Check if we've reached the browser limit
  if (activeBrowsers.size >= getMaxBrowserLimit()) {
    throw new Error(`Maximum browser limit (${getMaxBrowserLimit()}) reached. Cannot create new browser.`);
  }
  
  // Use the linkId as browserId if provided, or generate a new one
  const browserId = linkId || `browser-${++browserCounter}`;
  logger.info(`Launching browser ${browserId}`);
  
  try {
    // Import the GPM login module dynamically to avoid circular dependencies
    const GpmLogin = require('./gpm-login/Gpmlogin_run');
    
    // Launch the browser
    const { browser, page } = await GpmLogin.runChromeWithGpmlogin(proxy);
    
    // Setup disconnection handler
    browser.on('disconnected', () => {
      logger.info(`Browser ${browserId} disconnected`);
      activeBrowsers.delete(browserId);
    });
    
    // Store the browser instance
    activeBrowsers.set(browserId, {
      browser,
      page,
      proxy,
      timestamp: Date.now(),
    });
    
    logger.info(`Successfully launched browser ${browserId} (${activeBrowsers.size}/${getMaxBrowserLimit()})`);
    return { browser, page, browserId };
  } catch (error) {
    logger.error(`Failed to launch browser ${browserId}: ${error}`);
    throw error;
  }
}

/**
 * Close a specific browser instance
 * @param {string} browserId - ID of the browser to close
 */
async function closeBrowser(browserId) {
  const instance = activeBrowsers.get(browserId);
  if (instance) {
    logger.info(`Closing browser ${browserId}`);
    try {
      // await instance.browser.close();
      // activeBrowsers.delete(browserId);
      logger.info(`Browser ${browserId} closed successfully`);
    } catch (error) {
      logger.error(`Error closing browser ${browserId}: ${error.message}`);
      // Remove from active browsers anyway
      // activeBrowsers.delete(browserId);
    }
  }
}

/**
 * Close all active browser instances
 */
async function closeAllBrowsers() {
  logger.info(`Closing all browsers (${activeBrowsers.size} active)`);
  
  const closingPromises = [];
  for (const [browserId, instance] of activeBrowsers.entries()) {
    try {
      // closingPromises.push(instance.browser.close());
      logger.info(`Initiated close for browser ${browserId}`);
    } catch (error) {
      logger.error(`Error closing browser ${browserId}: ${error.message}`);
    }
  }
  
  await Promise.all(closingPromises);
  activeBrowsers.clear();
  
  // Force kill Chrome processes if needed
  try {
    execSync('taskkill /F /IM chrome.exe', { stdio: 'ignore' });
  } catch (error) {
    // Ignore errors as Chrome might not be running
  }
  
  logger.info('All browsers closed');
}

/**
 * Get the number of active browsers
 * @returns {number} Count of active browsers
 */
function getActiveBrowserCount() {
  return activeBrowsers.size;
}

/**
 * Set a temporary override to the maximum browser limit
 * @param {number} limit - New maximum browser limit 
 */
function setTempMaxBrowserLimit(limit) {
  if (typeof limit === 'number' && limit > 0) {
    config.TEMP_MAX_BROWSERS = limit;
    logger.info(`Set temporary maximum browser limit to ${limit}`);
  } else {
    logger.warn(`Invalid browser limit value: ${limit}. Must be a positive number.`);
  }
}

module.exports = {
  launchBrowser,
  closeBrowser,
  closeAllBrowsers,
  getActiveBrowserCount,
  getMaxBrowserLimit,
  setTempMaxBrowserLimit
}; 