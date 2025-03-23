const { connect } = require("puppeteer-real-browser");
// const pluginProxy = require('puppeteer-extra-plugin-proxy');
const { proxyRoating, setProxyOnPage } = require("../helper/proxy.js");

async function initBrowserWithRealBrowser(browserId,proxy) {
  const identifier =
    browserId || `browser-${Math.random().toString(36).substring(2, 8)}`;
  // console.log(`Browser ${identifier}: Initializing browser`);

  let hiddenChrome =
    process.env.hidden_chrome?.toLowerCase() === "false" ? false : true;

  // Create unique user data directory for each browser to isolate cookies and session data
  const userDataDir = `./user-data-${identifier}`;

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
    console.log(`Browser ${identifier}: Applying proxy`, proxy.proxy);
    await setProxyOnPage(page, proxy, identifier);
    console.log(`Browser ${identifier}: Initial proxy applied to first page`);
  }

  return { browser, page };
}

module.exports = {
  initBrowserWithRealBrowser,
};
