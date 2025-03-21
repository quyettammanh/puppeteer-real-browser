const { randomTime } = require("../../helper/func");
const {cancellBooking} = require("../helper/click_cancel_booking");

async function stepLogin(page, user) {
  try {
    console.log("Login");
    const emailInput = await page.$("#username");
    // await emailInput.click({ clickCount: 3 }); 
    await emailInput.type(user.email);
    const passwordInput = await page.$("#password");
    // await passwordInput.click({ clickCount: 3 });
    await passwordInput.type(user.password);
    await page.keyboard.press("Enter");
    // await page.waitForNetworkIdle({ idleTime: 3000, maxInflightRequests: 0 });
    await page.waitForNavigation({ waitUntil: 'domcontentloaded' }); // Hoặc 'load', 'domcontentloaded'
    console.log("Đăng nhập thành công (dùng input + CSS selector + id)");

    await randomTime(1, 2);
    console.log("Login currentUrl:", page.url());

    await cancellBooking(page);
    // console.log("Input data");
  } catch (error) {
    console.error("Error in stepLogin:", error);
  }
}

module.exports = {
  stepLogin,
};