const { loadUsersForExam } = require('./examUtils.js');

// Store available users for each exam type
const availableUsersByExam = new Map();

// Store currently active users (being used in browsers)
const activeUsers = new Set();

// Store users on cooldown with timestamps
const userCooldowns = new Map();

// Cooldown time in milliseconds (1 minute by default, can be adjusted)
let USER_COOLDOWN_TIME = 10 * 60 * 1000;

/**
 * Set the user cooldown time in minutes
 * @param {number} minutes - Number of minutes for cooldown
 */
function setUserCooldownTime(minutes) {
  if (typeof minutes === 'number' && minutes >= 0) {
    USER_COOLDOWN_TIME = minutes * 60 * 1000;
    console.log(`Set user cooldown time to ${minutes} minutes`);
  } else {
    console.error(`Invalid cooldown time value: ${minutes}`);
  }
}

/**
 * Get the remaining cooldown time for a user in seconds
 * @param {Object} user - The user object to check
 * @returns {number} - Remaining cooldown time in seconds, or 0 if not on cooldown
 */
function getUserCooldownRemaining(user) {
  if (!user || !user.email || !userCooldowns.has(user.email)) return 0;
  
  const cooldownUntil = userCooldowns.get(user.email);
  const now = Date.now();
  
  if (now > cooldownUntil) return 0;
  
  return Math.ceil((cooldownUntil - now) / 1000);
}

/**
 * Track a user as currently active
 * @param {Object} user - The user object to mark as active
 * @returns {boolean} - true if user was marked active, false if already active
 */
function trackActiveUser(user) {
  if (!user || !user.email) return false;
  
  // Check if user is already active
  if (activeUsers.has(user.email)) {
    console.warn(`User ${user.email} is already active. Should not be used in multiple browsers.`);
    return false;
  }
  
  activeUsers.add(user.email);
  return true;
}

/**
 * Check if a user is currently active
 * @param {Object} user - The user object to check
 * @returns {boolean} - true if user is active
 */
function isUserActive(user) {
  if (!user || !user.email) return false;
  return activeUsers.has(user.email);
}

/**
 * Check if a user is on cooldown
 * @param {Object} user - The user object to check
 * @returns {boolean} - true if user is on cooldown
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
 * Release a user from active status
 * @param {Object} user - The user object to release
 */
function releaseActiveUser(user) {
  if (!user || !user.email) return;
  
  if (activeUsers.has(user.email)) {
    activeUsers.delete(user.email);
  }
}

/**
 * Set a user on cooldown
 * @param {Object} user - The user object to put on cooldown
 */
function setUserOnCooldown(user) {
  if (!user || !user.email) return;
  
  const cooldownUntil = Date.now() + USER_COOLDOWN_TIME;
  userCooldowns.set(user.email, cooldownUntil);
  
  const minutes = USER_COOLDOWN_TIME / 1000 / 60;
  console.log(`User ${user.email} put on ${minutes} minute cooldown until ${new Date(cooldownUntil).toLocaleTimeString()}`);
}

/**
 * Get the next available user for a specific exam type
 * @param {string} location - Exam location (hcm, hanoi)
 * @param {string} level - Exam level (b1, b2, etc.)
 * @returns {Object} - Available user or null if none available
 */
async function getNextUser(location, level) {
  const examKey = `${location}_${level}`;
  
  // Initialize user list for this exam if not already done
  if (!availableUsersByExam.has(examKey)) {
    const users = await loadUsersForExam(location, level);
    if (!users || users.length === 0) {
      console.warn(`No users available for ${examKey}`);
      return null;
    }
    availableUsersByExam.set(examKey, [...users]);
  }
  
  const availableUsers = availableUsersByExam.get(examKey);
  if (availableUsers.length === 0) {
    // console.log(`No available users left for ${examKey}. Waiting for current sessions to complete.`);
    return null;
  }
  
  // Find a user that is not currently active and not on cooldown
  for (let i = 0; i < availableUsers.length; i++) {
    if (!isUserActive(availableUsers[i]) && !isUserOnCooldown(availableUsers[i])) {
      // Get and remove the user from the available list
      const user = availableUsers.splice(i, 1)[0];
      // Mark user as active
      trackActiveUser(user);
      return user;
    }
  }
  
  console.log(`All users for ${examKey} are currently active in browsers or on cooldown`);
  return null;
}

/**
 * Return a user to the available pool
 * @param {Object} user - The user object to return to the pool
 * @param {string} location - Exam location
 * @param {string} level - Exam level
 */
function returnUserToPool(user, location, level) {
  const examKey = `${location}_${level}`;
  
  if (!availableUsersByExam.has(examKey)) {
    availableUsersByExam.set(examKey, []);
  }
  
  // Release user from active status
  releaseActiveUser(user);
  
  // Put user on cooldown before returning to pool
  setUserOnCooldown(user);
  
  availableUsersByExam.get(examKey).push(user);
  console.log(`User ${user.email} returned to the available pool for ${examKey}. Available users: ${availableUsersByExam.get(examKey).length}`);
}

/**
 * Get count of available users for a specific exam type
 * @param {string} location - Exam location
 * @param {string} level - Exam level
 * @returns {number} - Count of available users
 */
function getAvailableUserCount(location, level) {
  const examKey = `${location}_${level}`;
  
  if (!availableUsersByExam.has(examKey)) {
    return 0;
  }
  
  // Count only users that are not on cooldown
  let availableCount = 0;
  for (const user of availableUsersByExam.get(examKey)) {
    if (!isUserOnCooldown(user)) {
      availableCount++;
    }
  }
  
  return availableCount;
}

/**
 * Reset the user pool for a specific exam or all exams
 * @param {string} examKey - Optional exam key to reset specific pool
 */
function resetUserPool(examKey = null) {
  if (examKey) {
    availableUsersByExam.delete(examKey);
  } else {
    availableUsersByExam.clear();
  }
}

/**
 * Get list of all active users
 * @returns {Array} - Array of active user emails
 */
function getActiveUsers() {
  return Array.from(activeUsers);
}

/**
 * Debug function to print all active users
 */
function debugActiveUsers() {
  console.log(`Active users (${activeUsers.size}): ${Array.from(activeUsers).join(', ')}`);
}

module.exports = {
  getNextUser,
  returnUserToPool,
  getAvailableUserCount,
  resetUserPool,
  trackActiveUser,
  isUserActive,
  releaseActiveUser,
  isUserOnCooldown,
  setUserCooldownTime,
  getUserCooldownRemaining,
  getActiveUsers,
  debugActiveUsers
}; 