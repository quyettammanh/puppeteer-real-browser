/**
 * Registration example using the enhanced registrationManager
 * Shows how to use the registration manager to handle browser sessions
 */
const registrationManager = require('../browser/registrationManager');
const { taskRegisterGoethe } = require('../register/register');
const path = require('path');
const fs = require('fs');

// Example: Load user data from a JSON file
function loadUserData(filePath) {
  try {
    const resolvedPath = path.resolve(process.cwd(), filePath);
    console.log(`Loading user data from: ${resolvedPath}`);
    
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`File not found: ${resolvedPath}`);
    }
    
    const data = fs.readFileSync(resolvedPath, 'utf8');
    const users = JSON.parse(data);
    
    if (!Array.isArray(users)) {
      throw new Error('Invalid data format: Expected an array of users');
    }
    
    return users;
  } catch (error) {
    console.error(`Error loading user data: ${error.message}`);
    return [];
  }
}

// Example: Simple method to process a single user
async function processUser(registrationUrl, user, examCode) {
  console.log(`Processing registration for ${user.email} (exam: ${examCode})`);
  
  try {
    // Method 1: Use the registration manager to get a browser and then use taskRegisterGoethe directly
    const session = await registrationManager.startRegistrationSession(
      registrationUrl,
      user,
      examCode
    );
    
    // Path to proxy file
    const pathProxy = path.join(process.cwd(), 'data/proxy/proxy.txt');
    
    // Use the existing taskRegisterGoethe function
    await taskRegisterGoethe(
      session.browser,
      session.page,
      session.url,
      user,
      pathProxy,
      examCode,
      session.browserId,
      'success' // complete all steps
    );
    
    // End the session - keep the browser open if needed for debugging
    await registrationManager.endRegistrationSession(
      session.browserId,
      examCode,
      user.email,
      true, // success
      false  // don't force close for debugging
    );
    
    console.log(`Registration completed for ${user.email}`);
    return { success: true, user: user.email };
  } catch (error) {
    console.error(`Error in registration process for ${user.email}: ${error.message}`);
    return { success: false, user: user.email, error: error.message };
  }
}

// Example: Using the performRegistration helper (more convenient)
async function processUserSimplified(registrationUrl, user, examCode) {
  // Create a registration process function that takes the browser and page
  const registrationProcess = async (browser, page, user, examCode, session) => {
    const pathProxy = path.join(process.cwd(), 'data/proxy/proxy.txt');
    
    // Use the existing taskRegisterGoethe function
    await taskRegisterGoethe(
      browser,
      page,
      session.url,
      user,
      pathProxy,
      examCode,
      session.browserId,
      'success'
    );
    
    // Return success information
    return { success: true, user: user.email };
  };
  
  // Use the performRegistration helper to handle the entire process
  return await registrationManager.performRegistration(
    registrationProcess,
    registrationUrl,
    user,
    examCode,
    {
      // Optional parameters
      forceClose: false // Keep browser open for debugging
    }
  );
}

// Example: Process multiple users with browser management
async function processMultipleUsers(registrationUrl, users, examCode) {
  const results = [];
  
  for (const user of users) {
    // Check if we have available browser slots
    const status = registrationManager.getSessionStatus();
    
    if (status.isAtCapacity) {
      console.log(`Browser limit reached (${status.activeCount}/${status.maxLimit}). Waiting for slots...`);
      // Wait for a slot to become available
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
    
    // Process the user
    const result = await processUserSimplified(registrationUrl, user, examCode);
    results.push(result);
  }
  
  return results;
}

// Main function
async function main() {
  try {
    // Example registration URL
    const registrationUrl = "https://www.goethe.de/ins/vn/vi/sta/han/prf/gzb1/kue.html";
    
    // Example exam code
    const examCode = "B1";
    
    // Load users from a JSON file
    const usersFilePath = './data/user/hn/hn_b1.json';
    const users = loadUserData(usersFilePath);
    
    if (users.length === 0) {
      console.log("No valid users found. Exiting.");
      return;
    }
    
    // Process a single user for testing
    console.log("Testing with a single user...");
    const singleResult = await processUserSimplified(registrationUrl, users[0], examCode);
    console.log("Single user result:", singleResult);
    
    // Uncomment to process all users
    /*
    console.log("\nProcessing all users...");
    const results = await processMultipleUsers(registrationUrl, users, examCode);
    
    // Print summary
    const successful = results.filter(r => r.success).length;
    console.log("\n=== Registration Results ===");
    console.log(`Total: ${results.length}`);
    console.log(`Successful: ${successful}`);
    console.log(`Failed: ${results.length - successful}`);
    */
    
  } catch (error) {
    console.error("Error in main process:", error.message);
  }
}

// Run the main function if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  processUser,
  processUserSimplified,
  processMultipleUsers
}; 