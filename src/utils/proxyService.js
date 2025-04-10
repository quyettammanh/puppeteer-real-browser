/**
 * Proxy Service
 * Handles proxy loading and validation
 */
const fs = require('fs');
const { createLogger } = require('./logger');

const logger = createLogger('ProxyService');

/**
 * Load proxies from a text file
 * @param {string} filePath - Path to the proxy file
 * @returns {Array<string>} List of valid proxies
 */
function loadProxiesFromFile(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            logger.warn(`Proxy file not found: ${filePath}`);
            return [];
        }

        const fileContent = fs.readFileSync(filePath, 'utf8');
        const lines = fileContent.split('\n');

        // Filter out empty lines and validate proxy format
        const validProxies = lines
            .map(line => line.trim())
            .filter(line => line && !line.startsWith('#'))
            .filter(line => validateProxyFormat(line));

        logger.info(`Loaded ${validProxies.length} valid proxies from ${filePath}`);
        return validProxies;
    } catch (error) {
        logger.error(`Error loading proxies from ${filePath}: ${error.message}`, error);
        return [];
    }
}

/**
 * Validate proxy format (ip:port or ip:port:user:pass)
 * @param {string} proxy - Proxy string to validate
 * @returns {boolean} True if valid
 */
function validateProxyFormat(proxy) {
    // Check for IP:PORT format (IP can contain letters and numbers)
    const ipPortRegex = /^[a-zA-Z0-9.-]+:\d{1,5}$/;
    if (ipPortRegex.test(proxy)) {
        return true;
    }

    // Check for IP:PORT:USER:PASS format
    const authProxyRegex = /^[a-zA-Z0-9.-]+:\d{1,5}:[^:]+:[^:]+$/;
    if (authProxyRegex.test(proxy)) {
        return true;
    }

    // HTTP/HTTPS proxy format
    if (proxy.startsWith('http://') || proxy.startsWith('https://')) {
        return true;
    }

    logger.warn(`Invalid proxy format: ${proxy}`);
    return false;
}

/**
 * Format proxy string for Puppeteer
 * @param {string} proxy - Proxy string
 * @returns {string} Formatted proxy
 */
function formatProxyForPuppeteer(proxy) {
    // If already has http/https prefix, return as is
    if (proxy.startsWith('http://') || proxy.startsWith('https://')) {
        return proxy;
    }

    // Check if it's user:pass@ip:port format
    if (proxy.includes('@')) {
        return `http://${proxy}`;
    }

    // Check if it's IP:PORT:USER:PASS format
    const parts = proxy.split(':');
    if (parts.length === 4) {
        const [ip, port, user, pass] = parts;
        return `http://${user}:${pass}@${ip}:${port}`;
    }

    // Default IP:PORT format
    return `http://${proxy}`;
}

async function setProxyOnPage(page, proxy, browserId) {
    console.log("tạm thời không sử dụng proxy")
    return page;
    // if (!proxy || !proxy.proxy || !proxy.port) {
    //     console.log("Không có proxy, không thiết lập proxy.");
    //     return page;
    // }

    // try {
    //     // Use provided browserId or generate a random one
    //     const browserIdentifier = browserId || Math.random().toString(36).substring(2, 10);

    //     // Xác định loại proxy
    //     let proxyUrl;
    //     if (proxy.type === "socks5") {
    //         // console.log("proxy.username", proxy.username);
    //         proxyUrl = `socks5://${encodeURIComponent(
    //             proxy.username
    //         )}:${encodeURIComponent(proxy.password)}@${proxy.proxy}:${proxy.port
    //             }`;
    //     } else if (proxy.type === "http") {
    //         proxyUrl = `http://${encodeURIComponent(
    //             proxy.username
    //         )}:${encodeURIComponent(proxy.password)}@${proxy.proxy}:${proxy.port
    //             }`;
    //     } else {
    //         throw new Error("Proxy type not supported");
    //     }

    //     // console.log(`Browser ${browserIdentifier}: Setting proxy ${proxy.proxy}:${proxy.port}`);

    //     // Reset request interception - make sure to handle errors
    //     try {
    //         await page.setRequestInterception(false);
    //         await page.setRequestInterception(true);
    //     } catch (err) {
    //         // console.error(`Browser ${browserIdentifier}: Error setting request interception:`, err.message);
    //         // Try to continue even if this fails
    //     }

    //     // Remove all previous listeners to avoid memory leaks
    //     const listenerCount = page.listenerCount("request");
    //     if (listenerCount > 0) {
    //         // console.log(`Browser ${browserIdentifier}: Removing ${listenerCount} existing request listeners`);
    //         page.removeAllListeners("request");
    //     }

    //     // Add new proxy
    //     page.on("request", async (request) => {
    //         try {
    //             await useProxy(request, proxyUrl.toString());
    //         } catch (err) {
    //             // Only log the first part of the error to avoid spam
    //             const errorMsg = err.message || "Unknown error";
    //             const shortError = errorMsg.split('\n')[0];
    //             // console.log(`Browser ${browserIdentifier}: Proxy error:`, shortError);

    //             try {
    //                 request.continue();
    //             } catch (continueErr) {
    //                 // Request might already be handled, ignore this error
    //             }
    //         }
    //     });

        // return page;
    // } catch (error) {
    //     console.error("Error in setProxyOnPage:", error.message);
    //     return page; // Return the page even if proxy setup fails
    // }
}

function getProxies(filePath) {
    try {
        // Ensure filePath is a string
        if (Array.isArray(filePath)) {
            throw new Error("filePath must be a string");
        }
        // Read the proxy file
        const proxyText = fs.readFileSync(filePath, "utf-8");

        // Split the proxy text into lines and process each line
        const proxies = proxyText
            .trim()
            .split("\n")
            .map((line) => {
                const parts = line.split(":");
                const ip = parts[0];
                const port = parts[1];
                const username = parts[2] || null;
                const password = parts[3] || null;
                let type = "http";
                if (parts.length == 5) {
                    type = "socks5";
                }

                if (username === null && password === null) {
                    return {
                        proxy: ip,
                        port: port,
                        username: "",
                        password: "",
                        type: type,
                    };
                } else {
                    // Remove \r from password if present
                    const sanitizedPassword = password ? password.replace("\r", "") : "";
                    return {
                        proxy: ip,
                        port: port,
                        username: username || "",
                        password: sanitizedPassword,
                        type: type,
                    };
                }
            });

        return proxies;
    } catch (error) {
        console.error("Error in getProxiesPlaywright:", error);
        return [];
    }
}

module.exports = {
    loadProxiesFromFile,
    validateProxyFormat,
    formatProxyForPuppeteer,
    setProxyOnPage,
    getProxies
}; 