/**
 * Tối ưu hóa quá trình đăng nhập để nhập thông tin user nhanh nhất có thể
 * 
 * Các cải tiến chính:
 * 1. Sử dụng page.evaluate để nhập trực tiếp thay vì type từng ký tự
 * 2. Tìm và sử dụng nút đăng nhập thay vì chỉ dùng Enter
 * 3. Cải thiện xử lý lỗi navigation
 * 4. Giảm thời gian chờ và timeout
 * 5. Sử dụng networkidle0 để đảm bảo trang đã tải hoàn toàn
 */

const { randomTime } = require("../../../utils/func");
const { cancellBooking } = require("../helper/click_cancel_booking");
const { waitForLoadingComplete } = require("../helper/wait_for_loading");

async function stepLogin(page, user) {
  try {
    console.log("Login");
    
    // Đợi cho trang loading biến mất với timeout ngắn hơn
    await waitForLoadingComplete(page, { timeout: 2000 });
    
    // Nhập thông tin đăng nhập trực tiếp bằng JavaScript - phương pháp nhanh nhất
    await page.evaluate(({ email, password }) => {
      document.getElementById('username').value = email;
      document.getElementById('password').value = password;
    }, { email: user.email, password: user.password });
    
    // Bấm nút đăng nhập thay vì Enter để tăng độ tin cậy
    try {
      // Tìm nút đăng nhập bằng nhiều selector phổ biến
      const loginButton = await page.$('button[type="submit"], input[type="submit"], .login-button, #login-button, .btn-login, #btn-login');
      if (loginButton) {
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 5000 }),
          loginButton.click()
        ]);
      } else {
        // Fallback: Sử dụng Enter nếu không tìm thấy nút đăng nhập
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 5000 }),
          page.keyboard.press("Enter")
        ]);
      }
      console.log("Đăng nhập thành công (dùng evaluate để nhập nhanh)");
    } catch (navigationError) {
      // Xử lý trường hợp không có navigation nhưng vẫn đăng nhập thành công
      console.warn("Cảnh báo khi đăng nhập (navigation):", navigationError.message);
      // Tiếp tục thực hiện thay vì throw error
    }

    // Đợi cho trang sau đăng nhập loading biến mất với timeout ngắn hơn
    await waitForLoadingComplete(page, { 
      timeout: 800, 
      logEnabled: false 
    });

    // Giảm thời gian chờ ngẫu nhiên xuống mức tối thiểu
    await randomTime(0.2, 0.5);
    console.log("Login currentUrl:", page.url());

    // Kiểm tra URL sau đăng nhập để xác nhận thành công
    const currentUrl = page.url();
    if (currentUrl.includes("login") || currentUrl.includes("error")) {
      // Kiểm tra thông báo lỗi trên trang
      const errorMessage = await page.evaluate(() => {
        const errorElement = document.querySelector('.error-message, .alert-danger, .error, #error-message');
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

// Phương pháp thay thế nếu evaluate không hoạt động
async function stepLoginAlternative(page, user) {
  try {
    console.log("Login (alternative method)");
    
    await waitForLoadingComplete(page, { timeout: 2000 });
    
    // Phương pháp thay thế: Sử dụng click + focus trước khi nhập
    await page.click('#username', { clickCount: 3 }); // Triple click để chọn toàn bộ text
    await page.keyboard.type(user.email, { delay: 0 }); // Không delay giữa các ký tự
    
    await page.click('#password', { clickCount: 3 });
    await page.keyboard.type(user.password, { delay: 0 });
    
    // Tiếp tục với các bước tương tự như phương pháp chính
    // ...
  } catch (error) {
    console.error("Error in stepLoginAlternative:", error.message);
    throw error;
  }
}

module.exports = {
  stepLogin,
  stepLoginAlternative
};

// const { randomTime } = require("../../../utils/func");
// const { cancellBooking } = require("../helper/click_cancel_booking");
// const { waitForLoadingComplete } = require("../helper/wait_for_loading");

// async function stepLogin(page, user) {
//   try {
//     console.log("Login");
    
//     // Đợi cho trang loading biến mất
//     await waitForLoadingComplete(page);
    
//     // Đợi cho form đăng nhập xuất hiện
//     const emailInput = await page.waitForSelector("#username", { 
//       visible: true, 
//       timeout: 3000 
//     });
    
//     // Xóa giá trị hiện tại và nhập email
//     await page.evaluate(() => document.getElementById('username').value = '');
//     await emailInput.type(user.email, { delay: 5 });
    
//     // Xử lý input password
//     const passwordInput = await page.waitForSelector("#password", { 
//       visible: true, 
//       timeout: 5000 
//     });
    
//     // Xóa giá trị hiện tại và nhập password
//     await page.evaluate(() => document.getElementById('password').value = '');
//     await passwordInput.type(user.password, { delay: 5 });
    
//     // Bấm Enter và đợi điều hướng
//     try {
//       await Promise.race([
//         Promise.all([
//           page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 5000 }),
//           page.keyboard.press("Enter")
//         ]),
//         new Promise((_, reject) => 
//           setTimeout(() => reject(new Error('Login timeout after pressing Enter')), 2000)
//         )
//       ]);
//       console.log("Đăng nhập thành công (dùng input + CSS selector + id)");
//     } catch (navigationError) {
//       console.error("Lỗi khi đăng nhập (navigation):", navigationError.message);
//       throw new Error(`Lỗi điều hướng sau khi đăng nhập: ${navigationError.message}`);
//     }

//     // Đợi cho trang sau đăng nhập loading biến mất (nếu có)
//     await waitForLoadingComplete(page, { 
//       timeout: 1000, 
//       logEnabled: false 
//     });

//     await randomTime(1, 2);
//     console.log("Login currentUrl:", page.url());

//     // Kiểm tra URL sau đăng nhập để xác nhận thành công
//     const currentUrl = page.url();
//     if (currentUrl.includes("login") || currentUrl.includes("error")) {
//       // Kiểm tra thông báo lỗi trên trang
//       const errorMessage = await page.evaluate(() => {
//         const errorElement = document.querySelector('.error-message, .alert-danger');
//         return errorElement ? errorElement.textContent.trim() : null;
//       });
      
//       if (errorMessage) {
//         throw new Error(`Đăng nhập thất bại với lỗi: ${errorMessage}`);
//       } else {
//         throw new Error('Đăng nhập thất bại, vẫn ở trang login hoặc trang lỗi');
//       }
//     }

//     await cancellBooking(page);
//   } catch (error) {
//     console.error("Error in stepLogin:", error.message);
//     // Re-throw error để hàm gọi có thể xử lý
//     throw error;
//   }
// }

// module.exports = {
//   stepLogin,
// };