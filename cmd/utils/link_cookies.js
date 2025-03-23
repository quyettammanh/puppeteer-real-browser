/**
 * Extract cookies from URL query parameters
 * @param {string} url - URL containing cookies in query parameters
 * @returns {string|null} - String of cookies in format "name=value; name2=value2"
 */
async function extractCookies(url) {
    try {
        const parsedUrl = new URL(url);
        const cookies = {};
        parsedUrl.searchParams.forEach((value, key) => {
            cookies[key] = value;
        });
        const cookiesStr = Object.entries(cookies)
            .map(([key, value]) => `${key}=${value}`)
            .join('; ');
        return cookiesStr;
    } catch (error) {
        console.error('Error extracting cookies:', error);
        return null;
    }
}

/**
 * Parse cookie string into cookie objects for Puppeteer
 * @param {string} cookiesString - Cookies string in format "name=value; name2=value2"
 * @param {string} url - URL used to extract domain and path
 * @returns {Array} - Array of cookie objects for Puppeteer
 */
function parseCookies(cookiesString, url) {
    try {
        const urlObj = new URL(url);
        return cookiesString.split('; ').map(cookie => {
            const [name, ...rest] = cookie.split('=');
            const value = rest.join('=');
            return {
                name: decodeURIComponent(name),
                value: decodeURIComponent(value),
                domain: urlObj.hostname,
                path: '/', // Default path is root
                httpOnly: false,
                secure: urlObj.protocol === 'https:',
                sameSite: 'Lax'
            };
        });
    } catch (error) {
        console.error('Error parsing cookies:', error);
        return [];
    }
}

module.exports = {
    extractCookies,
    parseCookies
}
