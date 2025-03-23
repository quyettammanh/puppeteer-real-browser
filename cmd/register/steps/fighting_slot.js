const { gotoPage } = require("../../helper/goto_page.js");
const { getProxies, setProxyOnPage } = require("../../helper/proxy.js");

async function fightingForSlots(browser, page, url, pathProxy, browserId) {
  try {
    console.log("chọn module đăng ký");
    let attempt = 0;
    let maxAttempts = 5;

    // Use provided browserId or create a random one
    const identifier = browserId || Math.random().toString(36).substring(2, 10);

    while (attempt < maxAttempts) {
      attempt++;
      console.log(`Browser ${identifier}: Attempt ${attempt}/${maxAttempts} to access page`);
      
      const response = await gotoPage(page, url);
      if (response && response.status() === 200) {
        console.log(`Browser ${identifier}: Đã vào trang thành công!`, response.url());
        return page;
      } else {
        console.log(`Browser ${identifier}: Vào trang thất bại, thử lại lần`, attempt);
        
        // Get a random proxy
        const proxies = getProxies(pathProxy);
        if (!proxies || proxies.length === 0) {
          console.warn(`Browser ${identifier}: Không có proxy khả dụng, tiếp tục không có proxy`);
          continue;
        }
        
        const randomProxy = proxies[Math.floor(Math.random() * proxies.length)];
        console.log(`Browser ${identifier}: Applying new proxy`, randomProxy.proxy);
        
        // Apply the proxy to the current page
        console.log("randomProxy", randomProxy);
        await setProxyOnPage(page, randomProxy, identifier);
        
        // Try again with the new proxy
        const newResponse = await gotoPage(page, url);
        if (newResponse && newResponse.status() === 200) {
          console.log(`Browser ${identifier}: Đã vào trang thành công với proxy mới!`, newResponse.url());
          return page;
        }
      }
    }
    
    console.log(`Browser ${identifier}: Failed after ${maxAttempts} attempts`);
    return null;
  } catch (error) {
    const errorMsg = error.message || 'Unknown error';
    if (!errorMsg.includes("Target page, context or browser has been closed")) {
      console.error(`Error in fightingForSlots for browser ${browserId}:`, errorMsg);
    }
    return null;
  }
}

module.exports = { fightingForSlots };
