const { connect } = require("puppeteer-real-browser");
// const pluginProxy = require('puppeteer-extra-plugin-proxy');
const { proxyRoating, setProxyOnPage } = require("../helper/proxy.js");

async function initBrowserWithRealBrowser(proxy, browserId) {
  const identifier =
    browserId || `browser-${Math.random().toString(36).substring(2, 8)}`;
  console.log(`Browser ${identifier}: Initializing browser`);

  let hiddenChrome =
    process.env.open_chrome?.toLowerCase() === "false" ? false : true;
  hiddenChrome = false;
  console.log(`Browser ${identifier}: hiddenChrome: ${hiddenChrome}`);

  // Create unique user data directory for each browser to isolate cookies and session data
  const userDataDir = `./user-data-${identifier}`;
  console.log(`Browser ${identifier}: Using isolated user data directory: ${userDataDir}`);

  // Create configuration object
  const connectOptions = {
    headless: hiddenChrome,
    args: [
      // Add arguments to optimize for multiple tabs
      "--disable-background-timer-throttling",
      "--disable-backgrounding-occluded-windows",
      "--disable-renderer-backgrounding",
    ],
    defaultViewport: null, // Make viewport responsive
    userDataDir: userDataDir, // Each browser gets its own user data directory for cookie isolation
  };

  // Connect using the prepared options
  const { browser, page } = await connect(connectOptions);

  // Apply the proxy to the initial page if provided
  if (proxy) {
    await setProxyOnPage(page, proxy, identifier);
    console.log(`Browser ${identifier}: Initial proxy applied to first page`);
  }

  return { browser, page };
}

module.exports = {
  initBrowserWithRealBrowser,
};
