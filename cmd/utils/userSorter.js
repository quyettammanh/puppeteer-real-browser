const fs = require('fs');
const path = require('path');

/**
 * Get users from JSON file
 * @param {string} location - Location code (e.g. 'hcm')
 * @param {string} level - Level code (e.g. 'b2')
 * @returns {Array} Array of users
 */
function getUsersFromJson(location, level) {
    const filePath = path.join(__dirname, `../data/user/${location}/${location}_${level}.json`);
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading user file: ${error.message}`);
        return [];
    }
}

/**
 * Filter and sort users based on matching modules
 * @param {string} modules - Comma-separated list of modules (e.g. "Reading,Listening,Writing,Speaking")
 * @param {string} location - Location code (e.g. 'hcm')
 * @param {string} level - Level code (e.g. 'b2')
 * @returns {Array} Sorted array of matching users
 */
function getSortedUsersByModules(modules, location, level) {
    const users = getUsersFromJson(location, level);
    const moduleList = modules.split('-');
    
    // Filter users who have at least one matching module
    const matchingUsers = users.filter(user => {
        return moduleList.some(module => {
            const moduleKey = module.toLowerCase();
            return user[moduleKey] === "1";
        });
    });

    // Sort users by:
    // 1. Priority (1 first)
    // 2. Sum (descending)
    // 3. Original order (maintained by stable sort)
    matchingUsers.sort((a, b) => {
        // First compare by priority
        const priorityA = parseInt(a.priority || "0");
        const priorityB = parseInt(b.priority || "0");
        if (priorityA !== priorityB) {
            return priorityB - priorityA; // 1 comes before 0
        }

        // If priorities are equal, compare by sum
        const sumA = parseInt(a.sum);
        const sumB = parseInt(b.sum);
        if (sumA !== sumB) {
            return sumB - sumA; // Higher sum comes first
        }

        // If both priority and sum are equal, maintain original order
        return 0;
    });

    return matchingUsers;
}

/**
 * Get required skills for a user based on modules
 * @param {Object} user - User object
 * @param {string} modules - Comma-separated list of modules
 * @returns {Array} Array of required skills
 */
function getRequiredSkills(user, modules) {
    const moduleList = modules.split('-');
    const skills = [];
    
    moduleList.forEach(module => {
        const moduleKey = module.toLowerCase();
        if (user[moduleKey] === "1") {
            skills.push(module);
        }
    });

    return skills;
}

module.exports = {
    getSortedUsersByModules,
    getRequiredSkills
}; 