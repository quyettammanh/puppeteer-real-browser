const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { stepLogin } = require('./steps/login');
const browserManager = require('../../utils/browserManager');

/**
 * Run registration for a single user
 * @param {Object} user - User data
 * @param {string} userId - Unique user ID (used for browser assignment)
 */
async function runRegistration(user, userId) {
  let browser = null;
  let page = null;
  
  try {
    console.log(`[${userId}] Starting registration process for user: ${user.email}`);
    
    // Get a dedicated browser for this user
    const result = await browserManager.getBrowser(userId, {
      // Optional browser config overrides
      defaultViewport: {
        width: 1366,
        height: 768
      }
    });
    
    browser = result.browser;
    page = result.page;
    
    // Configure page settings
    await page.setDefaultNavigationTimeout(30000);
    await page.setViewport({ width: 1366, height: 768 });
    
    // Go to login page
    await page.goto('https://www.goethe.de/ins/vn/vi/index.html', {
      waitUntil: 'domcontentloaded'
    });
    
    // Execute login step
    await stepLogin(page, user);
    
    // Continue with other steps...
    // await stepRegistration(page, user);
    // etc.
    
    console.log(`[${userId}] Registration completed for user: ${user.email}`);
    return { success: true, message: 'Registration completed' };
    
  } catch (error) {
    console.error(`[${userId}] Registration error for ${user.email}: ${error.message}`);
    
    // Optional: Take screenshot on error
    if (page) {
      const screenshotDir = path.join(__dirname, '../../../screenshots');
      fs.mkdirSync(screenshotDir, { recursive: true });
      await page.screenshot({ 
        path: path.join(screenshotDir, `error_${userId}_${Date.now()}.png`),
        fullPage: true 
      });
    }
    
    return { success: false, message: error.message };
  } finally {
    // Always close the browser when done to free up resources
    if (userId) {
      await browserManager.closeBrowser(userId);
    }
  }
}

/**
 * Process multiple users with a limit on concurrent browsers
 * @param {Array} users - Array of user data objects
 * @param {number} maxConcurrent - Maximum number of concurrent browsers (default: 5)
 */
async function processUsers(users, maxConcurrent = 5) {
  console.log(`Starting to process ${users.length} users with max ${maxConcurrent} concurrent browsers`);
  
  // Set max browsers limit
  browserManager.setMaxBrowsers(maxConcurrent);
  
  const results = [];
  const pendingUsers = [...users];
  
  try {
    // Process users in batches to respect browser limits
    while (pendingUsers.length > 0) {
      // Calculate available browser slots
      const availableSlots = browserManager.getMaxBrowsers() - browserManager.getActiveBrowserCount();
      
      if (availableSlots <= 0) {
        // No slots available, wait before checking again
        console.log(`All browser slots in use. Waiting for availability...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
        continue;
      }
      
      // Take only as many users as we have browser slots
      const currentBatch = pendingUsers.splice(0, availableSlots);
      console.log(`Processing batch of ${currentBatch.length} users...`);
      
      // Process each user in this batch
      const promises = currentBatch.map((user, index) => {
        // Create a unique ID for each user
        const userId = `user_${user.email.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}_${index}`;
        return runRegistration(user, userId);
      });
      
      // Wait for all users in this batch to complete
      const batchResults = await Promise.allSettled(promises);
      
      // Process results
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push({
            user: currentBatch[index].email,
            ...result.value
          });
        } else {
          results.push({
            user: currentBatch[index].email,
            success: false,
            message: result.reason?.message || 'Unknown error'
          });
        }
      });
      
      // Small delay between batches
      if (pendingUsers.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log(`Completed processing all users. Results: ${results.length}`);
    return results;
    
  } catch (error) {
    console.error(`Error in batch processing: ${error.message}`);
    throw error;
  } finally {
    // Make sure all browsers are closed
    await browserManager.closeAll();
    console.log('All browsers closed');
  }
}

module.exports = {
  runRegistration,
  processUsers
}; 