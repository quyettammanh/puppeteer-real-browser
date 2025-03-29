const Genlogin = require("./Genlogin");
const { connect } = require("puppeteer-core");
const { setProxyOnPage } = require("../helper/proxy");

async function runChromeWithGenlogin(proxy) {
  const genlogin = new Genlogin("");
  const profiles = (await genlogin.getProfiles(0, 1000)).profiles;
  let { wsEndpoint } = await genlogin.runProfile(profiles[0].id);
  console.log("Đã lấy được wsEndpoint:", wsEndpoint);
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
