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

/**
 * Launch a browser instance using gpm-login
 * @param {string} proxy - Optional proxy to use
 * @returns {Promise<Object>} Browser and page objects
 */
async function launchBrowser(proxy = null) {
  const browserId = `browser-${++browserCounter}`;
  logger.info(`Launching browser ${browserId}`);
  
  try {
    // Import the GPM login module dynamically to avoid circular dependencies
    const GpmLogin = require('./gpm-login/Gpmlogin_run');
    
    // // Create a new browser instance
    // const gpmLogin = new GpmLogin({
    //   executablePath: config.browser.hiddenChrome,
    //   proxy: proxy || null,
    // });
    
    // Launch the browser
    const { browser, page } = await GpmLogin.runChromeWithGpmlogin(proxy);
    
    // Store the browser instance
    activeBrowsers.set(browserId, {
      browser,
      page,
      proxy,
      timestamp: Date.now(),
    });
    
    logger.info(`Successfully launched browser ${browserId}`);
    return { browser, page, browserId };
  } catch (error) {
    // logger.error(`Failed to launch browser ${browserId}: ${error.message}`);
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
      await instance.browser.close();
      activeBrowsers.delete(browserId);
      logger.info(`Browser ${browserId} closed successfully`);
    } catch (error) {
      logger.error(`Error closing browser ${browserId}: ${error.message}`);
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
      closingPromises.push(instance.browser.close());
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

module.exports = {
  launchBrowser,
  closeBrowser,
  closeAllBrowsers,
  getActiveBrowserCount,
}; 