const path = require("path");
const fs = require("fs");
const { createUsers, checkUserPathByKey } = require("./user.js");

// Store users by location and exam level
const usersByExam = new Map();

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
    console.error(`Error parsing exam code ${examCode}:`, error);
    return { location: null, level: null };
  }
}

/**
 * Load users for a specific location and level
 * @param {string} location - Location (hcm or hn)
 * @param {string} level - Exam level (b1, b2, etc.)
 * @returns {Array} - List of users
 */
async function loadUsersForExam(location, level) {
  // Create a cache key based on location and level
  const examKey = `${location}_${level}`;

  // Return cached users if available
  if (usersByExam.has(examKey)) {
    console.log(`Using cached users for ${examKey}`);
    return usersByExam.get(examKey);
  }

  try {
    // Get user path directly using checkUserPathByKey function
    const userFilePath = checkUserPathByKey(examKey);
    
    if (fs.existsSync(userFilePath)) {
      console.log(`Loading users from ${userFilePath}`);
      const users = await createUsers(userFilePath);
      // Cache users for this exam
      usersByExam.set(examKey, users);
      return users;
    } else {
      console.warn(`User file not found: ${userFilePath}`);
      return [];
    }
  } catch (error) {
    console.error(`Error loading users for ${location}/${level}:`, error);
    return [];
  }
}

/**
 * Load default users when specific users cannot be found
 * @param {string} examKey - The exam key for caching
 * @returns {Array} - List of users
 */
async function loadDefaultUsers(examKey) {
  console.log(`Loading default users`);
  const defaultUserPath = "./cmd/data/user/1.json";

  try {
    if (fs.existsSync(defaultUserPath)) {
      const users = await createUsers(defaultUserPath);
      usersByExam.set(examKey, users);
      return users;
    } else {
      console.error(`Default user file not found: ${defaultUserPath}`);
      return [];
    }
  } catch (error) {
    console.error(`Error loading default users:`, error);
    return [];
  }
}

/**
 * Clear the user cache for a specific exam or all exams
 * @param {string} examKey - Optional exam key to clear specific cache
 */
function clearUserCache(examKey = null) {
  if (examKey) {
    usersByExam.delete(examKey);
    console.log(`Cleared user cache for ${examKey}`);
  } else {
    usersByExam.clear();
    console.log(`Cleared all user caches`);
  }
}

module.exports = {
  parseExamCode,
  loadUsersForExam,
  clearUserCache,
};
