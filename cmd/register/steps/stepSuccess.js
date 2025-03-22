const { takeScreenshot } = require("../../helper/func.js");

// Helper function for waiting since page.waitForTimeout is not available
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Handle success page processing
 * @param {Object} page - Puppeteer page object
 * @param {Object} user - User object with email and other details
 * @param {Function} log - Logging function
 * @returns {Promise<boolean>} - Whether the step was successful
 */
async function stepSuccess(page, user, log = console.log) {
  log("🎉 Final Step: Success page reached");
  
  // Wait for the page to be fully loaded
  try {
    log("Waiting for success page to stabilize...");
    
    // Wait for network to be idle - better approach than waitForNavigation
    await page.waitForFunction(() => {
      return document.readyState === 'complete' && 
             performance.now() > 1000; // Ensure at least 1 second has passed
    }, { timeout: 30000 }).catch(() => {
      log("Timeout while waiting for page to stabilize, continuing anyway");
    });
    
    // Additional wait to ensure all elements are rendered
    await wait(3000); // Using custom wait function instead of page.waitForTimeout
    
    log("Success page appears ready, taking screenshot");
    
    // Create success directory if it doesn't exist
    const fs = require('fs');
    const path = require('path');
    const successDir = path.join(process.cwd(), 'cmd/data/img/success');
    
    if (!fs.existsSync(successDir)) {
      fs.mkdirSync(successDir, { recursive: true });
      log(`Created success directory at ${successDir}`);
    }
    
    // Take a detailed screenshot of the success page
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const filename = `${user.email}_success_${timestamp}.png`;
    const filePath = path.join(successDir, filename);
    
    await page.screenshot({ 
      path: filePath,
      fullPage: true,
    });
    
    log(`✅ Success screenshot saved to ${filePath}`);
    
    // Also save a copy with takeScreenshot function for consistency
    await takeScreenshot(page, user, { 
      fullPage: true,
      fileName: `success_completed_${timestamp}.png`,
      createDateFolder: true
    });
    
    return true;
  } catch (error) {
    log(`Error capturing success page: ${error.message}`);
    return false;
  }
}

module.exports = { stepSuccess }; 