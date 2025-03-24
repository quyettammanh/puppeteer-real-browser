const { loadUsersForExam } = require('./examUtils.js');

// Store available users for each exam type
const availableUsersByExam = new Map();

// Store currently active users (being used in browsers)
const activeUsers = new Set();

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
  
  // Find a user that is not currently active
  for (let i = 0; i < availableUsers.length; i++) {
    if (!isUserActive(availableUsers[i])) {
      // Get and remove the user from the available list
      const user = availableUsers.splice(i, 1)[0];
      // Mark user as active
      trackActiveUser(user);
      return user;
    }
  }
  
  console.log(`All users for ${examKey} are currently active in browsers`);
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
  
  return availableUsersByExam.get(examKey).length;
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

module.exports = {
  getNextUser,
  returnUserToPool,
  getAvailableUserCount,
  resetUserPool,
  trackActiveUser,
  isUserActive,
  releaseActiveUser
}; 