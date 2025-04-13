/**
 * Registration Manager
 * Connects to the existing registration code and manages the registration process
 */
const path = require('path');
const { createLogger } = require('../utils/logger');
const { releaseUser } = require('../services/userManager');
const { parseRegistrationUrl } = require('../utils/urlParser');
const browserManager = require('./browserManager.js');

const logger = createLogger('RegistrationManager');

/**
 * Start the registration process for a user
 * @param {Object} browser - Puppeteer browser instance
 * @param {Object} page - Puppeteer page instance
 * @param {string} registrationUrl - Registration URL with cookies
 * @param {Object} user - User data
 * @param {string} examCode - Exam code
 * @param {string} browserId - Browser identifier
 * @param {Function} onCompleteCallback - Callback to execute when registration completes
 * @returns {Promise<boolean>} Success status
 */
async function startRegistration(browser, page, registrationUrl, user, examCode, browserId, onCompleteCallback) {
  logger.info(`Starting registration for ${user.email} with exam ${examCode}`);
  
  try {
    // Check if URL has cookies already applied to page
    // Note: cookies should be applied before calling this function
    
    // Import the original registration task function
    const { taskRegisterGoethe } = require('../register/register.js');
    
    // Get proxy path
    const pathProxy = path.join(process.cwd(), 'data/proxy/proxy.txt');
    
    // Start the registration process
    await taskRegisterGoethe(
      browser,
      page,
      registrationUrl,
      user,
      pathProxy,
      examCode,
      browserId,
      'success' // Complete the process to success
    );
    
    logger.info(`Registration process completed for ${user.email}`);
    
    // Release the user
    releaseUser(examCode, user.email);
    
    // Close the browser with callback
    await browserManager.closeBrowser(browserId, onCompleteCallback);
    
    return true;
  } catch (error) {
    logger.error(`Error in registration process for ${user.email}: ${error.message}`, error);
    
    // Release the user
    releaseUser(examCode, user.email);
    
    // Close the browser in case of error, with callback
    await browserManager.closeBrowser(browserId, onCompleteCallback);
    
    return false;
  }
}

/**
 * Process a link that contains both URL and cookies
 * @param {string} linkWithCookies - Link with embedded cookies
 * @returns {Object} Extracted URL and cookies
 */
function processLinkWithCookies(linkWithCookies) {
  // Use the utility from urlParser
  return parseRegistrationUrl(linkWithCookies);
}

/**
 * Apply cookies to a page before navigating
 * @param {Object} page - Puppeteer page
 * @param {Array} cookies - Array of cookie objects
 * @param {string} url - URL to navigate to after applying cookies
 * @returns {Promise<boolean>} Success status
 */
async function applyUrlCookiesAndNavigate(page, cookies, url) {
  try {
    if (!page || !url) {
      logger.error('Invalid page or URL provided');
      return false;
    }
    
    logger.info(`Applying ${cookies?.length || 0} cookies to page and navigating to ${url}`);
    
    // Apply cookies if available
    if (cookies && Array.isArray(cookies) && cookies.length > 0) {
      // Ensure cookies have domain set (use URL's domain if not)
      const urlObj = new URL(url);
      const formattedCookies = cookies.map(cookie => ({
        ...cookie,
        domain: cookie.domain || urlObj.hostname,
        path: cookie.path || '/'
      }));
      
      // Set cookies on the page
      await page.setCookie(...formattedCookies);
      logger.info(`Successfully applied ${formattedCookies.length} cookies to page`);
    }
    
    // Navigate to the URL
    await page.goto(url, { waitUntil: 'networkidle2' });
    logger.info(`Successfully navigated to ${url}`);
    
    return true;
  } catch (error) {
    logger.error(`Error applying cookies and navigating: ${error.message}`, error);
    return false;
  }
}

module.exports = {
  startRegistration,
  processLinkWithCookies,
  applyUrlCookiesAndNavigate
}; 