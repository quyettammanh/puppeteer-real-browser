const { randomTime } = require("../../helper/func");
const { cancellBooking } = require("../helper/click_cancel_booking");
const { waitForLoadingComplete } = require("../helper/wait_for_loading");

async function stepLogin(page, user) {
  try {
    console.log("Login");
    
    // Đợi cho trang loading biến mất
    await waitForLoadingComplete(page);
    
    // Đợi cho form đăng nhập xuất hiện
    const emailInput = await page.waitForSelector("#username", { 
      visible: true, 
      timeout: 3000 
    });
    
    // Xóa giá trị hiện tại và nhập email
    await page.evaluate(() => document.getElementById('username').value = '');
    await emailInput.type(user.email, { delay: 5 });
    
    // Xử lý input password
    const passwordInput = await page.waitForSelector("#password", { 
      visible: true, 
      timeout: 5000 
    });
    
    // Xóa giá trị hiện tại và nhập password
    await page.evaluate(() => document.getElementById('password').value = '');
    await passwordInput.type(user.password, { delay: 5 });
    
    // Bấm Enter và đợi điều hướng
    try {
      await Promise.race([
        Promise.all([
          page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 1500 }),
          page.keyboard.press("Enter")
        ]),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Login timeout after pressing Enter')), 2000)
        )
      ]);
      console.log("Đăng nhập thành công (dùng input + CSS selector + id)");
    } catch (navigationError) {
      console.error("Lỗi khi đăng nhập (navigation):", navigationError.message);
      throw new Error(`Lỗi điều hướng sau khi đăng nhập: ${navigationError.message}`);
    }

    // Đợi cho trang sau đăng nhập loading biến mất (nếu có)
    await waitForLoadingComplete(page, { 
      timeout: 1000, 
      logEnabled: false 
    });

    await randomTime(1, 2);
    console.log("Login currentUrl:", page.url());

    // Kiểm tra URL sau đăng nhập để xác nhận thành công
    const currentUrl = page.url();
    if (currentUrl.includes("login") || currentUrl.includes("error")) {
      // Kiểm tra thông báo lỗi trên trang
      const errorMessage = await page.evaluate(() => {
        const errorElement = document.querySelector('.error-message, .alert-danger');
        return errorElement ? errorElement.textContent.trim() : null;
      });
      
      if (errorMessage) {
        throw new Error(`Đăng nhập thất bại với lỗi: ${errorMessage}`);
      } else {
        throw new Error('Đăng nhập thất bại, vẫn ở trang login hoặc trang lỗi');
      }
    }

    await cancellBooking(page);
  } catch (error) {
    console.error("Error in stepLogin:", error.message);
    // Re-throw error để hàm gọi có thể xử lý
    throw error;
  }
}

module.exports = {
  stepLogin,
};