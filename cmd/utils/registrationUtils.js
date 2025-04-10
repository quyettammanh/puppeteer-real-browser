const { initBrowserWithRealBrowser } = require("../puppeteer/multi_browser.js");
const { runChromeWithGenlogin } = require("../gem-login/Genlogin_run.js");
const { runChromeWithGpmlogin } = require("../gpm-login/Gpmlogin_run.js");
const { taskRegisterGoethe } = require("../register/register.js");
const { parseExamCode } = require("./examUtils.js");
const { getNextUser, returnUserToPool, releaseActiveUser } = require("./userPool.js");
const { extractCookies, parseCookies } = require("./link_cookies.js");

// Store active browsers to manage them
const activeBrowsers = new Map();

/**
 * Process a single registration task
 * @param {string} url - Registration URL
 * @param {string} examCode - Exam code (e.g. "hcm_b2-link16")
 * @param {string} modules - Modules to register for (e.g. "Reading-Listening-Writing-Speaking")
 * @param {string} date - Exam date
 * @param {Object} user - User object with credentials
 * @param {string} proxy - Proxy to use
 * @param {string} browserId - Unique browser identifier
 * @param {string} cookies - Cookies extracted from the URL (optional)
 * @param {boolean} forceClose - If true, browser will be immediately closed (for timeouts)
 * @returns {Promise<void>}
 */
async function processRegistration(url, examCode, modules, date, user, proxy, browserId, cookies = null, forceClose = false) {
  console.log(`Processing registration for ${user.email} - Exam: ${examCode}, Date: ${date}`);
  console.log(`Modules: ${modules}, URL: ${url}, Browser ID: ${browserId}`);
  if (cookies) {
    console.log(`Using cookies from link`);
  }
  
  try {
    // If force close is true, try to close browser if it exists and return early
    if (forceClose && activeBrowsers.has(browserId)) {
      console.log(`Force closing browser ${browserId}`);
      const { browser } = activeBrowsers.get(browserId);
      try {
        await browser.close();
      } catch (e) {
        console.error(`Error force closing browser ${browserId}:`, e);
      }
      activeBrowsers.delete(browserId);
      console.log(`Active browsers after force close: ${activeBrowsers.size}`);
      return;
    }
    
    console.log(`Starting browser for user ${user.email}, browser ID: ${browserId}`);
    
    // Initialize a new browser for this user with the browser ID
    // const { browser, page } = await runChromeWithGenlogin(proxy);
    const { browser, page } = await runChromeWithGpmlogin(proxy); 
    
    // Keep track of active browsers
    activeBrowsers.set(browserId, { browser, user });
    console.log(`Added browser to active set. Total active browsers: ${activeBrowsers.size}`);
    
    // If cookies were provided, set them on the page
    if (cookies) {
      try {
        // Wait for the page to be ready before setting cookies
        if (!page.isClosed()) {
          console.log(`Setting cookies on page for ${browserId}`);
          
          // Use the parseCookies function to convert cookie string to cookie objects
          const cookieObjects = parseCookies(cookies, url);
          
          if (cookieObjects.length > 0) {
            // Set cookies on the page
            await page.setCookie(...cookieObjects);
            console.log(`Successfully set ${cookieObjects.length} cookies on page for ${browserId}`);
          } else {
            console.log(`No valid cookies to set for ${browserId}`);
          }
        }
      } catch (error) {
        console.error(`Error setting cookies for ${browserId}:`, error);
        // Continue without cookies if there was an error
      }
    }
    
    // Process with this browser - pass modules and date as additional parameters
    const endStep = 'summary';
    await taskRegisterGoethe(browser, page, url, user, "./cmd/data/proxy/proxy.txt", examCode, browserId, modules, date, endStep);
    
    // Close only the page when done, not the browser
    console.log(`Browser ${browserId}: ${user.email} completed, closing page`);
    await browser.close();
    
    // Remove from active browsers
    activeBrowsers.delete(browserId);
    console.log(`Removed browser from active set. Remaining active browsers: ${activeBrowsers.size}`);
    
    // Explicitly release user from active status to ensure it's not left in active state
    releaseActiveUser(user);
    console.log(`Explicitly released user ${user.email} from active status`);
    
  } catch (error) {
    console.error(`Error for ${browserId} (${user.email}):`, error);
    // Remove from active browsers in case of error
    if (activeBrowsers.has(browserId)) {
      const { browser, page } = activeBrowsers.get(browserId);
      try {
        await browser.close();
      } catch (e) {
        // Ignore errors on cleanup
      }
      activeBrowsers.delete(browserId);
      console.log(`Removed browser from active set after error. Remaining active browsers: ${activeBrowsers.size}`);
      
      // Also release user from active status on error
      releaseActiveUser(user);
      console.log(`Released user ${user.email} from active status after error`);
    }
  }
}

/**
 * Process a registration link message from Redis
 * @param {string} message - The Redis message in format "link@examCode@modules@date"
 * @param {Array} listProxies - List of available proxies
 * @returns {Promise<void>}
 */
async function processRegistrationLink(message, listProxies) {
  try {
    // Parse the message in format "link@examCode@modules@date"
    const parts = message.split('@');
    
    if (parts.length < 4) {
      console.error(`Invalid message format. Expected "link@examCode@modules@date", got: ${message}`);
      return;
    }
    
    const link = parts[0];
    const examCode = parts[1];
    const modules = parts[2];
    const date = parts[3];
    
    // Extract location and level from exam code
    const { location, level } = parseExamCode(examCode);
    
    if (!location || !level) {
      console.error(`Could not parse location and level from exam code: ${examCode}`);
      return;
    }
    
    console.log(`Parsed exam code: Location=${location}, Level=${level}`);
    
    // Get an available user for this exam type
    console.log('222')
    const user = await getNextUser(location, level);
    if (!user) {
      console.log(`No users available to process link for ${location} ${level}. Adding back to queue.`);
      // TODO: Could implement a retry mechanism here
      return;
    }
    
    // Select a random proxy
    const proxy = listProxies[Math.floor(Math.random() * listProxies.length)];
    
    // Generate a unique browser ID for this instance
    const browserId = `browser-${Math.random().toString(36).substring(2, 8)}`;
    
    console.log(`Starting registration for ${user.email} with browser ID ${browserId}`);
    
    // Process the registration in a separate async context
    processRegistration(link, examCode, modules, date, user, proxy, browserId)
      .then(() => {
        // Return the user to the pool when done
        returnUserToPool(user, location, level);
      })
      .catch(error => {
        console.error(`Registration failed for ${user.email}:`, error);
        // Return the user to the pool even if there was an error
        returnUserToPool(user, location, level);
      });
  } catch (error) {
    console.error(`Error processing message: ${error.message}`);
  }
}

/**
 * Close all active browsers
 * @returns {Promise<void>}
 */
async function closeAllBrowsers() {
  console.log('Closing all active browsers...');
  
  const closingPromises = [];
  
  for (const [browserId, { browser, user }] of activeBrowsers.entries()) {
    try {
      console.log(`Closing browser for ${user.email} (${browserId})`);
      closingPromises.push(browser.close());
    } catch (error) {
      console.error(`Error closing browser ${browserId}:`, error);
    }
  }
  
  await Promise.allSettled(closingPromises);
  activeBrowsers.clear();
}

/**
 * Get all active browser sessions
 * @returns {Map} - Map of active browser sessions
 */
function getActiveBrowsers() {
  return activeBrowsers;
}

module.exports = {
  processRegistration,
  processRegistrationLink,
  closeAllBrowsers,
  getActiveBrowsers
}; 