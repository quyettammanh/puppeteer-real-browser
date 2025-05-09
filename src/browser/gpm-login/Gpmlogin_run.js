const Gpmlogin = require("./Gpmlogin");
const { connect } = require("puppeteer-core");
const { setProxyOnPage } = require("../../utils/proxyService");

// Track profile index for rotation
let currentProfileIndex = 0;

async function runChromeWithGpmlogin(proxy) {
  const gpmlogin = new Gpmlogin("");
  const profiles = (await gpmlogin.getProfiles(0, 1000)).profiles;
  
  // Use profile rotation instead of always using the first profile
  const profileIndex = currentProfileIndex % profiles.length;
  currentProfileIndex++;
  
  let { wsEndpoint } = await gpmlogin.runProfile(profiles[profileIndex].id);
  if (wsEndpoint == ""||wsEndpoint==null) {
    return { browser: null, page: null };
  }
  console.log(`Đã lấy được wsEndpoint từ profile #${profileIndex}:`, wsEndpoint);
  const browser = await connect({
    browserWSEndpoint: wsEndpoint,
    ignoreHTTPSErrors: true,
  });
  const identifier = `browser-${Math.random().toString(36).substring(2, 8)}`;
  const page = await browser.newPage();
  // Bật chế độ chặn request
  await page.setRequestInterception(true);

  page.on('request', request => {
    const url = request.url();

    if (url.includes('connect.facebook.net/en_US/fbevents.js')) {
      console.log('🛑 Blocked:', url);
      request.abort();
    } else {
      request.continue();
    }
  });
  await setProxyOnPage(page, proxy, identifier);
  return { browser, page };
}


module.exports = { runChromeWithGpmlogin};
