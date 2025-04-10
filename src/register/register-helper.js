/**
 * Registration helper functions
 * Uses the browserManager to ensure each registration uses its own browser
 */
const fs = require('fs');
const path = require('path');
const browserManager = require('../browser/browserManager');
const { stepLogin } = require('./register-goethe/steps/login');
const config = require('../config/env');

/**
 * Process a single user registration
 * @param {Object} user - User data with email, password, etc.
 * @param {string} userId - Unique ID for this user/task
 * @returns {Promise<Object>} Registration result
 */
async function processUser(user, userId) {
  console.log(`Starting registration for user: ${user.email} (ID: ${userId})`);
  let browser, page, browserId;
  
  try {
    // Get a browser for this specific user
    ({ browser, page, browserId } = await browserManager.launchBrowser(userId));
    
    console.log(`Browser ${browserId} assigned to user ${user.email}`);
    
    // Set up navigation and viewport
    await page.setDefaultNavigationTimeout(30000);
    
    // Navigate to the login page
    await page.goto('https://www.goethe.de/ins/vn/vi/index.html', {
      waitUntil: 'domcontentloaded'
    });
    
    // Perform login
    await stepLogin(page, user);
    
    // Continue with registration process...
    // Add your other steps here
    
    console.log(`Registration completed for user: ${user.email}`);
    return { success: true, message: 'Registration completed successfully' };
  } catch (error) {
    console.error(`Error registering user ${user.email}: ${error.message}`);
    
    // Save screenshot on error
    if (page) {
      try {
        const screenshotDir = path.join(process.cwd(), 'screenshots');
        fs.mkdirSync(screenshotDir, { recursive: true });
        
        const screenshotPath = path.join(
          screenshotDir, 
          `error_${userId}_${Date.now()}.png`
        );
        
        await page.screenshot({ 
          path: screenshotPath,
          fullPage: true 
        });
        
        console.log(`Error screenshot saved to ${screenshotPath}`);
      } catch (screenshotError) {
        console.error(`Failed to save error screenshot: ${screenshotError.message}`);
      }
    }
    
    return { success: false, error: error.message };
  } finally {
    // Always close the browser when done to free resources
    if (browserId) {
      await browserManager.closeBrowser(browserId);
    }
  }
}

/**
 * Process multiple users with limit on concurrent browsers
 * @param {Array<Object>} users - Array of user objects
 * @param {number} maxConcurrent - Temporary override for maximum concurrent browsers 
 * @returns {Promise<Array>} Results for each user
 */
async function processUsers(users, maxConcurrent = null) {
  // If maxConcurrent is provided, temporarily override the default setting
  if (maxConcurrent && typeof maxConcurrent === 'number' && maxConcurrent > 0) {
    browserManager.setTempMaxBrowserLimit(maxConcurrent);
  }
  
  const currentLimit = browserManager.getMaxBrowserLimit();
  console.log(`Processing ${users.length} users with max ${currentLimit} browsers`);
  
  const results = [];
  const pendingUsers = [...users]; // Make a copy we can modify
  
  try {
    // Process users in batches based on browser availability
    while (pendingUsers.length > 0) {
      const activeCount = browserManager.getActiveBrowserCount();
      const availableSlots = browserManager.getMaxBrowserLimit() - activeCount;
      
      if (availableSlots <= 0) {
        // Wait for browsers to free up
        console.log('All browser slots in use. Waiting...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        continue;
      }
      
      // Take a batch of users to process
      const batch = pendingUsers.splice(0, availableSlots);
      console.log(`Processing batch of ${batch.length} users`);
      
      // Start registration for each user in parallel
      const promises = batch.map((user, index) => {
        // Create a unique ID for this registration
        const userId = `user_${user.email.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}_${index}`;
        return processUser(user, userId);
      });
      
      // Wait for all registrations in this batch to complete
      const batchResults = await Promise.allSettled(promises);
      
      // Process and store results
      batch.forEach((user, index) => {
        const result = batchResults[index];
        if (result.status === 'fulfilled') {
          results.push({
            email: user.email,
            ...result.value
          });
        } else {
          results.push({
            email: user.email,
            success: false,
            error: result.reason?.message || 'Unknown error'
          });
        }
      });
      
      // Add a small delay between batches
      if (pendingUsers.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    return results;
  } finally {
    // Ensure all browsers are closed
    await browserManager.closeAllBrowsers();
  }
}

module.exports = {
  processUser,
  processUsers
}; 