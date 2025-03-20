async function randomTime(min, max) {
  const delay = Math.floor(Math.random() * (max - min + 1) + min) * 1000; // Tính bằng mili giây
  return new Promise((resolve) => setTimeout(resolve, delay));
}

const fs = require('fs')
// Hàm để nhận đầu vào từ người dùng (có thể giả lập)
async function userInputLoop () {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  })

  return new Promise(resolve => {
    readline.question(
      "Đã vào trang đăng ký (không nhấn 'out' để thoát): ",
      userInput => {
        readline.close()
        if (userInput.toLowerCase() === 'out') {
          resolve(false)
        } else {
          resolve(true)
        }
      }
    )
  })
}

async function acceptCookies(page, url, retries = 5, waitTime = 5000) {
  let attempt = 0;
  while (attempt < retries) {
    try {
      const cookieBanner = await page.$("#usercentrics-root");
      if (cookieBanner) {
        const shadowRoot = await page.evaluateHandle(
          (el) => el.shadowRoot,
          cookieBanner
        );
        const acceptButton = await shadowRoot.$(
          "[data-testid=uc-accept-all-button]"
        );
        if (acceptButton) {
          await acceptButton.click();
          isCookieAccepted = true;
        } else {
          console.log("Không có thông báo cookies.");
        }
      } else {
        console.log("Phần tử thông báo cookies không xuất hiện.");
      }
    } catch (error) {
      console.error(`Lỗi khi kiểm tra thông báo cookies: ${error.message}`);
    }
    attempt += 1;
  }
}

async function clickButtonContinue(page) {
  try {
      // Tìm button dựa trên selector (giả sử button có text 'tiếp tục')
      const buttons = await page.$$('button'); // Lấy tất cả các button
      let buttonToClick;

      // Lọc button có chứa text 'tiếp tục' (không phân biệt hoa thường)
      const matchingButtons = [];
      for (const button of buttons) {
          const text = await page.evaluate(el => el.textContent.trim().toLowerCase(), button);
          if (text.includes('tiếp tục')) {
              matchingButtons.push(button);
          }
      }

      // Đợi button đầu tiên xuất hiện trong vòng 1.5 giây
      await page.waitForFunction(
          () => Array.from(document.querySelectorAll('button'))
              .some(btn => btn.textContent.trim().toLowerCase().includes('tiếp tục')),
          { timeout: 1500 }
      );

      // Kiểm tra số lượng button tìm thấy
      const count = matchingButtons.length;
      if (count === 0) {
          console.log("Không tìm thấy nút tiếp tục");
          return;
      }

      // Chọn button để click
      if (count >= 2) {
          buttonToClick = matchingButtons[1]; // Chọn button thứ hai
          console.log("Đã tìm thấy nhiều hơn 1 nút 'tiếp tục', chọn nút thứ hai.");
      } else {
          buttonToClick = matchingButtons[0]; // Chọn button đầu tiên
      }

      // Click vào button
      await buttonToClick.click({ force: true });

      // Đợi trang load với timeout tối đa 3 giây hoặc tổng timeout 10 giây
      await Promise.race([
          page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 3000 }).catch(() => {}),
          new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Click operation timeout')), 10000)
          ),
      ]);

      console.log("Đã click và load trang hoàn tất");

      // Delay ngẫu nhiên từ 1 đến 2 giây
      await randomTime(1, 2);

  } catch (e) {
      console.log("Lỗi khi click button tiếp tục:", e.message);
      throw e; // Ném lại lỗi để caller xử lý
  }
}

async function clickRegisterForMe(page) {
  try {
      // Chuyển XPath sang CSS selector và đợi button xuất hiện
      await page.waitForSelector(
          'button.cs-button:not(:empty)', // Chọn button có class "cs-button" và không rỗng
          { visible: true, timeout: 5000 }
      );

      // Lấy button bằng CSS selector
      const buttons = await page.$$('button.cs-button');
      let button;
      for (const btn of buttons) {
          const text = await page.evaluate(el => el.textContent.trim(), btn);
          if (text === 'Đăng kí cho tôi') {
              button = btn;
              break;
          }
      }
      if (!button) {
          throw new Error("Không tìm thấy nút 'Đăng kí cho tôi'");
      }

      // Đảm bảo button có thể click được
      const isEnabled = await page.evaluate(
          (el) => !el.disabled && el.offsetParent !== null,
          button
      );
      if (!isEnabled) {
          throw new Error("Nút 'Đăng kí cho tôi' không thể click");
      }

      // Scroll đến button nếu cần
      await page.evaluate((el) => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), button);

      // Click button
      await button.click();

      console.log("Đã bấm nút đăng ký thành công");
  } catch (error) {
      console.log("Chọn đăng ký cho tôi lỗi:", error.message);
  }
}

async function loginGoethe(page,email,password) {
  try {
      // Chọn input email bằng CSS selector #username
      const emailInput = await page.$('#username');
      if (!emailInput) {
          throw new Error("Không tìm thấy trường email với id 'username'");
      }
      // Xóa và điền email
      await emailInput.click({ clickCount: 3 }); // Chọn toàn bộ nội dung để xóa
      await emailInput.type(email);

      // Chọn input password bằng CSS selector #password
      const passwordInput = await page.$('#password');
      if (!passwordInput) {
          throw new Error("Không tìm thấy trường mật khẩu với id 'password'");
      }
      // Xóa và điền mật khẩu
      await passwordInput.click({ clickCount: 3 }); // Chọn toàn bộ nội dung để xóa
      await passwordInput.type(password);

      // Nhấn Enter
      await page.keyboard.press('Enter');

      console.log("Đăng nhập thành công (dùng input + CSS selector + id)");
  } catch (error) {
      console.log("Lỗi khi đăng nhập:", error.message);
  }
}

async function stepConfirmDone(page) {
  try {
      console.log("Đã kiểm tra thông tin");

      // Sử dụng page.$ với CSS selector thay vì XPath
      console.log("Đợi nút thanh toán xuất hiện...");
      await page.waitForSelector('button.cs-button--arrow_next', {
          visible: true,
          timeout: 10000
      });

      // Lấy nút bằng CSS selector
      const button = await page.$('button.cs-button--arrow_next');
      const count = button ? 1 : 0; // page.$ chỉ trả về 1 element hoặc null

      if (count > 0) {
          console.log("Tìm thấy nút thanh toán");

          // Sử dụng evaluate để scroll
          await page.evaluate(() => {
              const button = document.querySelector('button.cs-button--arrow_next');
              if (button) {
                  button.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
          });

          // Bấm nút và đợi điều hướng trang
          console.log("Bấm nút thanh toán và đợi tải trang...");
          await Promise.all([
              page.waitForNavigation(), // Chờ điều hướng trang
              button.click(), // Bấm nút
          ]);
          console.log("Đã bấm nút thanh toán và hoàn tất tải trang");
      }
  } catch (error) {
      if (!error.message.includes('Target page, context or browser has been closed')) {
          console.error("Error in stepConfirmDone:", error);
      }
  }
}

module.exports = {
  acceptCookies,
  clickButtonContinue,
  clickRegisterForMe,
  randomTime,
  loginGoethe,
  userInputLoop,
  stepConfirmDone,
};
