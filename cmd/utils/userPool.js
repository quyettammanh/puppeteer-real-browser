const { loadUsersForExam } = require('./examUtils.js');

// Store available users for each exam type
const availableUsersByExam = new Map();

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
    console.log(`No available users left for ${examKey}. Waiting for current sessions to complete.`);
    return null;
  }
  
  // Get and remove the first user from the available list
  return availableUsers.shift();
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
  resetUserPool
}; 