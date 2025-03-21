const { initBrowserWithRealBrowser } = require("./puppeteer/multi_browser.js");
const { createUsers } = require("./utils/user.js");
const { taskRegisterGoethe } = require("./register/register.js");
const { getProxies } = require("./helper/proxy.js");
const { userInputLoop } = require("./helper/func.js");
(async () => {
  console.log("Register Goethe");
  const pathProxy = "./cmd/data/proxy/proxy.txt";
  const listProxies = getProxies(pathProxy);
  if (!listProxies || listProxies.length === 0) {
    console.warn(`Không có proxy nào cho exam`);
  }
  //C:\Users\Admin\AppData\Local\Temp\lighthouse.75670598\Default
  //C:\Users\Admin\AppData\Local\Temp\lighthouse.60880190\Default
const proxy = listProxies[Math.floor(Math.random() * listProxies.length)];
const { browser, page } = await initBrowserWithRealBrowser(proxy);
  const userByPath = "./cmd/data/user/1.json";
  const listUsers = await createUsers(userByPath);
  if (!listUsers || listUsers.length === 0) {
    console.warn(`Không có user nào cho exam`);
    return;
  }
  const user = listUsers[4];
  const exam = "b1_hcm";
  const url =
    "https://www.goethe.de/coe?lang=vi&oid=3a16cc8727c1736380043caf334b0cd50599061081cbdd96afaeca4171f12aee";
  await taskRegisterGoethe(browser, page, url, user, pathProxy, exam);
  // await userInputLoop();
  //   await browser.close();
  console.log("Done");
})();
