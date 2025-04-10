/**
 * Test utility to verify user filtering by modules
 */
const fs = require('fs');
const path = require('path');
const { createLogger } = require('./logger');

const logger = createLogger('TestUserModules');

/**
 * Test function to check user filtering based on modules
 * @param {string} examCode - Exam code (e.g., 'hcm_b2')
 * @param {string} modules - Module string (e.g., 'Reading-Listening-Writing-Speaking')
 */
async function testUserFiltering(examCode, modules = 'Reading-Listening-Writing-Speaking') {
  try {
    logger.info(`Testing user filtering for exam ${examCode} with modules: ${modules}`);
    
    // Parse exam code to get location and level
    let location = 'hcm';
    let level = 'b2';
    
    if (examCode) {
      if (examCode.toLowerCase().includes('hcm')) {
        location = 'hcm';
      } else if (examCode.toLowerCase().includes('hanoi') || examCode.toLowerCase().includes('hn')) {
        location = 'hn';
      }
      
      const levelMatch = examCode.toLowerCase().match(/b[0-9]|c[0-9]|a[0-9]/);
      if (levelMatch) {
        level = levelMatch[0];
      }
    }
    
    // Construct the file path
    let userFilePath;
    if (location === 'hcm') {
      userFilePath = path.join(process.cwd(), `data/user/hcm/hcm_${level}.json`);
    } else {
      userFilePath = path.join(process.cwd(), `data/user/hn/hn_${level}.json`);
    }
    
    // Check if file exists
    if (!fs.existsSync(userFilePath)) {
      logger.error(`User file not found: ${userFilePath}`);
      return;
    }
    
    // Load user data
    const users = JSON.parse(fs.readFileSync(userFilePath, 'utf8'));
    logger.info(`Loaded ${users.length} total users from ${userFilePath}`);
    
    // Convert modules to list
    const moduleList = modules.split('-');
    logger.info(`Filtering for modules: ${moduleList.join(', ')}`);
    
    // Filter users who have at least one matching module
    const matchingUsers = users.filter(user => {
      // Check if user has at least one required module
      const hasMatchingModule = moduleList.some(module => {
        const moduleKey = module.toLowerCase();
        return user[moduleKey] === "1";
      });
      
      // Ensure user has at least one active module
      const totalActiveModules = ['reading', 'listening', 'writing', 'speaking'].filter(
        mod => user[mod] === "1"
      ).length;
      
      return hasMatchingModule && totalActiveModules > 0;
    });
    
    logger.info(`Found ${matchingUsers.length} users matching modules out of ${users.length} total users`);
    
    // Display some sample matching users
    if (matchingUsers.length > 0) {
      logger.info('Sample matching users:');
      const sampleSize = Math.min(5, matchingUsers.length);
      
      for (let i = 0; i < sampleSize; i++) {
        const user = matchingUsers[i];
        const activeModules = ['reading', 'listening', 'writing', 'speaking']
          .filter(mod => user[mod] === "1")
          .map(mod => mod.charAt(0).toUpperCase() + mod.slice(1))
          .join(', ');
        
        logger.info(`${i+1}. ${user.email} - Active Modules: ${activeModules} - Priority: ${user.priority} - Sum: ${user.sum}`);
      }
    }
    
    // Check for users with no modules active
    const noModuleUsers = users.filter(user => 
      user.reading !== "1" && 
      user.listening !== "1" && 
      user.writing !== "1" && 
      user.speaking !== "1"
    );
    
    if (noModuleUsers.length > 0) {
      logger.warn(`Found ${noModuleUsers.length} users with NO active modules`);
      if (noModuleUsers.length > 0) {
        logger.warn(`Example: ${noModuleUsers[0].email}`);
      }
    }
    
    return {
      totalUsers: users.length,
      matchingUsers: matchingUsers.length,
      noModuleUsers: noModuleUsers.length,
      sampleUsers: matchingUsers.slice(0, 5)
    };
  } catch (error) {
    logger.error(`Error testing user filtering: ${error.message}`, error);
  }
}

/**
 * CLI entry point
 */
if (require.main === module) {
  const examCode = process.argv[2] || 'hcm_b2';
  const modules = process.argv[3] || 'Reading-Listening-Writing-Speaking';
  
  testUserFiltering(examCode, modules)
    .then(() => {
      logger.info('Test complete');
      process.exit(0);
    })
    .catch(error => {
      logger.error(`Test failed: ${error.message}`, error);
      process.exit(1);
    });
}

module.exports = {
  testUserFiltering
}; 