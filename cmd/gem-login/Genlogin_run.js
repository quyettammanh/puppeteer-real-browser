const Genlogin = require("./Genlogin");
const { connect } = require("puppeteer-core");
const { setProxyOnPage } = require("../helper/proxy");

// Track profile index for rotation
let currentProfileIndex = 0;

async function runChromeWithGenlogin(proxy) {
  const genlogin = new Genlogin("");
  const profiles = (await genlogin.getProfiles(0, 1000)).profiles;
  
  // Use profile rotation instead of always using the first profile
  const profileIndex = currentProfileIndex % profiles.length;
  currentProfileIndex++;
  
  let { wsEndpoint } = await genlogin.runProfile(profiles[profileIndex].id);
  console.log(`Đã lấy được wsEndpoint từ profile #${profileIndex}:`, wsEndpoint);
  const browser = await connect({
    browserWSEndpoint: wsEndpoint,
    ignoreHTTPSErrors: true,
  });
  const identifier = `browser-${Math.random().toString(36).substring(2, 8)}`;
  const page = await browser.newPage();
  await setProxyOnPage(page, proxy, identifier);
  return { browser, page };
}


module.exports = { runChromeWithGenlogin };
