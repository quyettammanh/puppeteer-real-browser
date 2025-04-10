const {acceptCookies} = require('./click_cookies.js');
const {waitForLoadingComplete} = require('./wait_for_loading.js');

async function clickRegisterForMe(page) {
  try {
    // Sử dụng hàm mới đợi loading biến mất
    await waitForLoadingComplete(page);

    await acceptCookies(page);

    // Chuyển XPath sang CSS selector và đợi button xuất hiện
    await page.waitForSelector(
      "button.cs-button:not(:empty)", // Chọn button có class "cs-button" và không rỗng
      { visible: true, timeout: 5000 }
    );

    // Lấy button bằng CSS selector
    const buttons = await page.$$("button.cs-button");
    let button;
    for (const btn of buttons) {
      const text = await page.evaluate((el) => el.textContent.trim(), btn);
      if (text === "Đăng kí cho tôi") {
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
    await page.evaluate(
      (el) => el.scrollIntoView({ behavior: "smooth", block: "center" }),
      button
    );

    // Click button và đợi navigation với xử lý timeout tốt hơn
    try {
      await Promise.race([
        Promise.all([
          page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }),
          button.click()
        ]),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Navigation timeout after clicking register button')), 15000)
        )
      ]);
      console.log("Đã bấm nút đăng ký thành công");
    } catch (error) {
      console.error(`Lỗi khi bấm nút đăng ký: ${error.message}`);
      // Đánh dấu isCookieAccepted để tránh lặp vô hạn
      const isCookieAccepted = true;
      // Throw để báo lỗi ngược lên hàm gọi
      throw new Error(`Không thể điều hướng sau khi bấm nút đăng ký: ${error.message}`);
    }
  } catch (error) {
    console.log("Chọn đăng ký cho tôi lỗi:", error.message);
    // Re-throw lỗi để đảm bảo hàm gọi có thể xử lý
    throw error;
  }
}

module.exports = {
  clickRegisterForMe,
};
