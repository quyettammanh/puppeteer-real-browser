/**
 * User Manager Service
 * Manages users for registration tasks
 */
const fs = require('fs');
const path = require('path');
const { createLogger } = require('../utils/logger');

const logger = createLogger('UserManager');

// Map to store users by exam
const usersByExam = new Map();
// Track which users are currently being used
const activeUsers = new Set();
// Store users on cooldown with timestamps
const userCooldowns = new Map();
// Cooldown time in milliseconds (10 minutes by default)
let USER_COOLDOWN_TIME = 10 * 60 * 1000;

/**
 * Set the user cooldown time in minutes
 * @param {number} minutes - Number of minutes for cooldown
 */
function setUserCooldownTime(minutes) {
  if (typeof minutes === 'number' && minutes >= 0) {
    USER_COOLDOWN_TIME = minutes * 60 * 1000;
    logger.info(`Set user cooldown time to ${minutes} minutes`);
  } else {
    logger.error(`Invalid cooldown time value: ${minutes}`);
  }
}

/**
 * Parse exam code to get location and level
 * @param {string} examCode - Exam code like "hcm_b2-link16"
 * @returns {Object} - Location and level information { location, level }
 */
function parseExamCode(examCode) {
  try {
    // Check for locations in the exam code
    let location = null;
    let level = null;

    // Try to extract location (hcm or hanoi)
    if (examCode.toLowerCase().includes("hcm")) {
      location = "hcm";
    } else if (
      examCode.toLowerCase().includes("hanoi") ||
      examCode.toLowerCase().includes("hn")
    ) {
      location = "hanoi";
    }

    // Try to extract level (b1, b2, c1, etc.)
    const levelMatch = examCode.toLowerCase().match(/b[0-9]|c[0-9]|a[0-9]/);
    if (levelMatch) {
      level = levelMatch[0];
    }

    return { location, level };
  } catch (error) {
    logger.error(`Error parsing exam code ${examCode}: ${error.message}`, error);
    return { location: null, level: null };
  }
}

/**
 * Check path for user data file based on exam key
 * @param {string} key - Exam key (e.g., "hcm_b2")
 * @returns {string} - Path to user data file
 */
function checkUserPathByKey(key) {
  logger.debug(`Finding user path for key: ${key}`);
  let userPath = '';
  const pathData = path.join(process.cwd(), 'data/user');
  
  if (key.includes("hanoi_a1")) {
    userPath = path.join(pathData, 'hn/hn_a1.json');
  } else if (key.includes("hanoi_a2")) {
    userPath = path.join(pathData, 'hn/hn_a2.json');
  } else if (key.includes("hanoi_b1")) {
    userPath = path.join(pathData, 'hn/hn_b1.json');
  } else if (key.includes("hanoi_b2")) {
    userPath = path.join(pathData, 'hn/hn_b2.json');
  } else if (key.includes("hcm_a1")) {
    userPath = path.join(pathData, 'hcm/hcm_a1.json');
  } else if (key.includes("hcm_a2")) {
    userPath = path.join(pathData, 'hcm/hcm_a2.json');
  } else if (key.includes("hcm_b1")) {
    userPath = path.join(pathData, 'hcm/hcm_b1.json');
  } else if (key.includes("hcm_b2")) {
    userPath = path.join(pathData, 'hcm/hcm_b2.json');
  } else {
    userPath = path.join(pathData, 'test/user.json'); 
  }
  
  return userPath;
}

/**
 * Load users for a specific exam
 * @param {string} examCode - The exam code (e.g., "hcm_b2-link1")
 * @returns {Promise<Array>} - Array of user objects
 */
async function loadUsersForExam(examCode) {
  try {
    const { location, level } = parseExamCode(examCode);
    if (!location || !level) {
      logger.error(`Invalid exam code format: ${examCode}`);
      return [];
    }
    
    const examKey = `${location}_${level}`;
    logger.debug(`Loading users for exam: ${examKey}`);
    
    // Return cached users if available
    if (usersByExam.has(examKey)) {
      logger.info(`Using cached users for ${examKey}`);
      return usersByExam.get(examKey);
    }
    
    // Get user path and check if file exists
    const userFilePath = checkUserPathByKey(examKey);
    if (!fs.existsSync(userFilePath)) {
      logger.error(`User file not found: ${userFilePath}`);
      return [];
    }
    
    // Load and parse user data
    const userData = JSON.parse(fs.readFileSync(userFilePath, 'utf8'));
    logger.info(`Loaded ${userData.length} users for ${examKey} from ${userFilePath}`);
    
    // Cache users for this exam
    usersByExam.set(examKey, userData);
    return userData;
  } catch (error) {
    logger.error(`Error loading users for exam ${examCode}: ${error.message}`, error);
    return [];
  }
}

/**
 * Sort users by modules, priority, and sum
 * @param {Array} users - Array of user objects
 * @param {string} modules - Module string (e.g., "Reading-Listening-Writing-Speaking")
 * @returns {Array} - Sorted array of users
 */
function sortUsersByModules(users, modules) {
  if (!users || !Array.isArray(users) || users.length === 0) {
    logger.warn('Empty or invalid users array provided to sortUsersByModules');
    return [];
  }
  
  const moduleList = modules.split('-');
  logger.info(`Filtering users for modules: ${moduleList.join(', ')}`);
  
  // Filter users who have at least one matching module
  const matchingUsers = users.filter(user => {
    // Ensure user has at least one module with value "1"
    const hasActiveModule = moduleList.some(module => {
      const moduleKey = module.toLowerCase();
      return user[moduleKey] === "1";
    });
    
    // If user has no modules set to "1", skip them
    const totalActiveModules = ['reading', 'listening', 'writing', 'speaking'].filter(
      mod => user[mod] === "1"
    ).length;
    
    if (totalActiveModules === 0) {
      return false;
    }
    
    return hasActiveModule;
  });
  
  logger.info(`Found ${matchingUsers.length} users with at least one matching module from ${users.length} total users`);
  
  // Sort users by priority (1 first), then by sum (descending)
  matchingUsers.sort((a, b) => {
    // First compare by priority
    const priorityA = parseInt(a.priority || "0");
    const priorityB = parseInt(b.priority || "0");
    if (priorityA !== priorityB) {
      return priorityB - priorityA; // 1 comes before 0
    }
    
    // If priorities are equal, compare by sum
    const sumA = parseInt(a.sum || "0");
    const sumB = parseInt(b.sum || "0");
    if (sumA !== sumB) {
      return sumB - sumA; // Higher sum comes first
    }
    
    // If both priority and sum are equal, maintain original order
    return 0;
  });
  
  if (matchingUsers.length > 0) {
    logger.debug(`First matching user: ${matchingUsers[0].email} with modules: ${['reading', 'listening', 'writing', 'speaking']
      .filter(mod => matchingUsers[0][mod] === "1")
      .join(', ')}`);
  }
  
  return matchingUsers;
}

/**
 * Check if a user is on cooldown
 * @param {Object} user - User object
 * @returns {boolean} - True if user is on cooldown
 */
function isUserOnCooldown(user) {
  if (!user || !user.email) return false;
  
  if (!userCooldowns.has(user.email)) return false;
  
  const cooldownUntil = userCooldowns.get(user.email);
  const now = Date.now();
  
  // If cooldown period has expired, remove from cooldown list
  if (now > cooldownUntil) {
    userCooldowns.delete(user.email);
    return false;
  }
  
  return true;
}

/**
 * Set a user on cooldown
 * @param {Object} user - User object
 */
function setUserOnCooldown(user) {
  if (!user || !user.email) return;
  
  const cooldownUntil = Date.now() + USER_COOLDOWN_TIME;
  userCooldowns.set(user.email, cooldownUntil);
  
  const minutes = USER_COOLDOWN_TIME / 1000 / 60;
  logger.info(`User ${user.email} put on ${minutes} minute cooldown until ${new Date(cooldownUntil).toLocaleTimeString()}`);
}

/**
 * Get the next available user for a specific exam with module filtering
 * @param {string} examCode - The exam code
 * @param {string} modules - Module string (e.g., "Reading-Listening-Writing-Speaking")
 * @returns {Promise<Object|null>} - User object or null if none available
 */
async function getNextUserForExam(examCode, modules = "Reading-Listening-Writing-Speaking") {
  try {
    // Load users if not already loaded
    const { location, level } = parseExamCode(examCode);
    if (!location || !level) {
      logger.error(`Invalid exam code format: ${examCode}`);
      return null;
    }
    
    const examKey = `${location}_${level}`;
    
    // Load users for this exam if not already cached
    if (!usersByExam.has(examKey)) {
      await loadUsersForExam(examCode);
    }
    
    // Get users for the exam
    const users = usersByExam.get(examKey);
    if (!users || users.length === 0) {
      logger.warn(`No users found for exam ${examCode}`);
      return null;
    }
    
    // Sort users by modules, priority and sum
    const sortedUsers = sortUsersByModules(users, modules);
    if (sortedUsers.length === 0) {
      logger.warn(`No users matching modules ${modules} for exam ${examCode}`);
      return null;
    }
    
    logger.info(`Found ${sortedUsers.length} users matching modules ${modules} for exam ${examCode}`);
    
    // Find a user that is not active and not on cooldown
    for (const user of sortedUsers) {
      const userKey = `${examKey}:${user.email}`;
      if (!activeUsers.has(userKey) && !isUserOnCooldown(user)) {
        // Mark user as active
        activeUsers.add(userKey);
        
        // Log user details
        const selectedModules = [];
        if (user.reading === "1") selectedModules.push("Reading");
        if (user.listening === "1") selectedModules.push("Listening");
        if (user.writing === "1") selectedModules.push("Writing");
        if (user.speaking === "1") selectedModules.push("Speaking");
        
        logger.info(`Allocated user ${user.email} for exam ${examCode} with modules: ${selectedModules.join(", ")}`);
        return user;
      }
    }
    
    logger.warn(`All users for exam ${examCode} matching modules ${modules} are currently active or on cooldown`);
    return null;
  } catch (error) {
    logger.error(`Error getting next user for exam ${examCode}: ${error.message}`, error);
    return null;
  }
}

/**
 * Release a user after registration is complete
 * @param {string} examCode - The exam code
 * @param {string} email - User email
 * @param {boolean} setCooldown - Whether to set the user on cooldown
 */
function releaseUser(examCode, email, setCooldown = true) {
  try {
    const { location, level } = parseExamCode(examCode);
    if (!location || !level) {
      logger.error(`Invalid exam code format: ${examCode}`);
      return;
    }
    
    const examKey = `${location}_${level}`;
    const userKey = `${examKey}:${email}`;
    
    // Remove from active users
    if (activeUsers.has(userKey)) {
      activeUsers.delete(userKey);
      logger.info(`Released user ${email} for exam ${examCode}`);
      
      // Set user on cooldown if requested
      if (setCooldown) {
        // Find the user object
        const users = usersByExam.get(examKey);
        if (users) {
          const user = users.find(u => u.email === email);
          if (user) {
            setUserOnCooldown(user);
          }
        }
      }
    }
  } catch (error) {
    logger.error(`Error releasing user ${email} for exam ${examCode}: ${error.message}`, error);
  }
}

/**
 * Get the count of active users
 * @returns {number} Number of active users
 */
function getActiveUserCount() {
  return activeUsers.size;
}

/**
 * Get available user count for an exam
 * @param {string} examCode - The exam code
 * @returns {number} Number of available users
 */
function getAvailableUserCount(examCode) {
  try {
    const { location, level } = parseExamCode(examCode);
    if (!location || !level) {
      return 0;
    }
    
    const examKey = `${location}_${level}`;
    const users = usersByExam.get(examKey);
    if (!users) return 0;
    
    // Count users that are neither active nor on cooldown
    let availableCount = 0;
    for (const user of users) {
      const userKey = `${examKey}:${user.email}`;
      if (!activeUsers.has(userKey) && !isUserOnCooldown(user)) {
        availableCount++;
      }
    }
    
    return availableCount;
  } catch (error) {
    logger.error(`Error getting available user count for ${examCode}: ${error.message}`, error);
    return 0;
  }
}

/**
 * Reset user pool for all exams or a specific exam
 * @param {string} examCode - Optional exam code to reset specific pool
 */
function resetUserPool(examCode = null) {
  if (examCode) {
    const { location, level } = parseExamCode(examCode);
    if (location && level) {
      const examKey = `${location}_${level}`;
      usersByExam.delete(examKey);
      logger.info(`Reset user pool for ${examKey}`);
    }
  } else {
    usersByExam.clear();
    logger.info('Reset all user pools');
  }
}

// Initialize on module load
loadUsersForExam("hcm_b2").catch(error => {
  logger.error(`Failed to initialize user manager: ${error.message}`, error);
});

module.exports = {
  loadUsersForExam,
  getNextUserForExam,
  releaseUser,
  getActiveUserCount,
  getAvailableUserCount,
  resetUserPool,
  setUserCooldownTime,
  parseExamCode,
  sortUsersByModules
}; 