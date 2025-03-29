const Genlogin = require("./Genlogin");
const { connect } = require("puppeteer-core");

async function runChromeWithGenlogin() {
  const genlogin = new Genlogin("");
  const profiles = (await genlogin.getProfiles(0, 1000)).profiles;
  let { wsEndpoint } = await genlogin.runProfile(profiles[0].id);
  console.log("Đã lấy được wsEndpoint:", wsEndpoint);
  const browser = await connect({
    browserWSEndpoint: wsEndpoint,
    ignoreHTTPSErrors: true,
  });
  const page = await browser.newPage();
  return { browser, page };
}


module.exports = { runChromeWithGenlogin };
