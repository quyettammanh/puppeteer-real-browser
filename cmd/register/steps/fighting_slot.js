const { gotoPage } = require("../../helper/goto_page.js");
const { getProxies ,setProxyOnPage} = require("../../helper/proxy.js");

async function fightingForSlots(browser, page, url, pathProxy) {
  try {
    console.log("chọn module đăng ký");
    let attempt = 0;
    let maxAttempts = 5;

    while (attempt < maxAttempts) {
      attempt++;
      const response = await gotoPage(page, url);
      if (response && response.status() === 200) {
        console.log("Đã vào trang thành công!", response.url());
        return page;
        // break; // Thoát vòng lặp khi đạt thành công
      } else {
        console.log("Vào trang thất bại, thử lại lần", attempt);
        const proxies = getProxies(pathProxy);
        const randomProxy = proxies[Math.floor(Math.random() * proxies.length)];
        const newPage=await setProxyOnPage(page,randomProxy);
        const response = await gotoPage(newPage, url);
        if (response && response.status() === 200) {
          console.log("Đã vào trang thành công!", response.url());
          return newPage;
        }
      }
    }
  } catch (error) {
    if (
      !error.message.includes("Target page, context or browser has been closed")
    ) {
      console.error("Error in fightingForSlots:", error);
    }
  }
}

module.exports = { fightingForSlots };
