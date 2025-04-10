/**
 * Logger Utility
 * Provides consistent logging throughout the application
 */

/**
 * Creates a logger instance with the given module name
 * @param {string} moduleName - Name of the module using this logger
 * @returns {Object} Logger object with logging methods
 */
function createLogger(moduleName) {
  const timestamp = () => new Date().toISOString();
  
  return {
    /**
     * Log an informational message
     * @param {string} message - The message to log
     */
    info: (message) => {
      console.log(`[${timestamp()}] [INFO] [${moduleName}] ${message}`);
    },
    
    /**
     * Log a warning message
     * @param {string} message - The message to log
     */
    warn: (message) => {
      console.warn(`[${timestamp()}] [WARN] [${moduleName}] ${message}`);
    },
    
    /**
     * Log an error message
     * @param {string} message - The message to log
     * @param {Error} error - Optional error object
     */
    error: (message, error) => {
      console.error(`[${timestamp()}] [ERROR] [${moduleName}] ${message}`);
      if (error && error.stack) {
        console.error(`[${timestamp()}] [ERROR] [${moduleName}] Stack: ${error.stack}`);
      }
    },
    
    /**
     * Log a debug message (only in development)
     * @param {string} message - The message to log
     */
    debug: (message) => {
      if (process.env.NODE_ENV === 'development') {
        console.debug(`[${timestamp()}] [DEBUG] [${moduleName}] ${message}`);
      }
    },
    
    /**
     * Log a message with a custom user identifier
     * @param {string} userId - User identifier (email, name, etc.)
     * @param {string} message - The message to log
     */
    user: (userId, message) => {
      console.log(`[${timestamp()}] [USER:${userId}] [${moduleName}] ${message}`);
    }
  };
}

module.exports = {
  createLogger
}; 