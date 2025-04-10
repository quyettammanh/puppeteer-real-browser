/**
 * URL Parser Utility
 * Parses registration URLs and extracts embedded cookies
 */
const { createLogger } = require('./logger');

const logger = createLogger('UrlParser');

/**
 * Parse a registration URL that may contain cookies
 * @param {string} url - Registration URL
 * @returns {Object} Object containing the url and cookies
 */
function parseRegistrationUrl(url) {
  try {
    if (!url) {
      logger.error('URL is empty or undefined');
      return { url: null, cookies: [] };
    }
    
    // Check if the URL contains cookies in special format
    if (url.includes('__cookies__')) {
      return extractCookiesFromUrl(url);
    }
    
    // Check if URL has query parameters (old format)
    if (url.includes('?')) {
      return extractCookiesFromQueryParams(url);
    }
    
    // Regular URL with no embedded cookies
    return { url, cookies: [] };
  } catch (error) {
    logger.error(`Error parsing registration URL: ${error.message}`, error);
    return { url: null, cookies: [] };
  }
}

/**
 * Extract cookies from a special format URL
 * @param {string} url - URL with embedded cookies
 * @returns {Object} Object containing the url and cookies
 */
function extractCookiesFromUrl(url) {
  try {
    // Assume format: actualUrl__cookies__[{cookie1},{cookie2},...]
    const parts = url.split('__cookies__');
    if (parts.length !== 2) {
      logger.warn(`Invalid URL cookie format: ${url}`);
      return { url: url, cookies: [] };
    }
    
    const actualUrl = parts[0];
    let cookiesStr = parts[1];
    
    // Try to parse the cookies
    try {
      // Remove any trailing characters
      if (cookiesStr.endsWith(';')) {
        cookiesStr = cookiesStr.slice(0, -1);
      }
      
      // Handle JSON array format
      if (cookiesStr.startsWith('[') && cookiesStr.endsWith(']')) {
        const cookies = JSON.parse(cookiesStr);
        logger.info(`Extracted ${cookies.length} cookies from URL (JSON format)`);
        return { url: actualUrl, cookies };
      }
      
      // Handle simple name=value format
      const cookies = cookiesStr.split(';').map(cookie => {
        const [name, value] = cookie.trim().split('=');
        return { name, value };
      });
      
      logger.info(`Extracted ${cookies.length} cookies from URL (string format)`);
      return { url: actualUrl, cookies };
    } catch (error) {
      logger.error(`Error parsing cookies: ${error.message}`, error);
      return { url: actualUrl, cookies: [] };
    }
  } catch (error) {
    logger.error(`Error extracting cookies from URL: ${error.message}`, error);
    return { url, cookies: [] };
  }
}

/**
 * Extract cookies from URL query parameters (old format)
 * @param {string} url - URL with cookies in query parameters
 * @returns {Object} Object containing the url and cookies
 */
function extractCookiesFromQueryParams(url) {
  try {
    const parsedUrl = new URL(url);
    const cookies = [];
    
    // Extract cookies from query parameters
    parsedUrl.searchParams.forEach((value, key) => {
      cookies.push({
        name: key,
        value: value
      });
    });
    
    // Remove query parameters from URL
    const cleanUrl = `${parsedUrl.origin}${parsedUrl.pathname}`;
    
    logger.info(`Extracted ${cookies.length} cookies from URL query parameters`);
    return { url: cleanUrl, cookies };
  } catch (error) {
    logger.error(`Error extracting cookies from query parameters: ${error.message}`, error);
    return { url, cookies: [] };
  }
}

/**
 * Format URL with cookies for use in links
 * @param {string} url - Base URL
 * @param {Array} cookies - Array of cookie objects
 * @returns {string} URL with embedded cookies
 */
function formatUrlWithCookies(url, cookies) {
  if (!cookies || !Array.isArray(cookies) || cookies.length === 0) {
    return url;
  }
  
  try {
    // Convert cookies to JSON string
    const cookiesStr = JSON.stringify(cookies);
    
    // Combine URL and cookies with separator
    return `${url}__cookies__${cookiesStr}`;
  } catch (error) {
    logger.error(`Error formatting URL with cookies: ${error.message}`, error);
    return url;
  }
}

module.exports = {
  parseRegistrationUrl,
  extractCookiesFromUrl,
  extractCookiesFromQueryParams,
  formatUrlWithCookies
}; 