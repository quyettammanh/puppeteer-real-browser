async function clickRegisterForMe(page) {
  try {
    // Đợi cho spinner và message "XIN CHỜ TRONG GIÂY LÁT" biến mất
    try {
      await page.waitForFunction(
        () => {
          // Kiểm tra text "XIN CHỜ TRONG GIÂY LÁT"
          const waitText = document.body.innerText.includes("XIN CHỜ TRONG GIÂY LÁT");
          // Kiểm tra spinner loading
          const spinner = document.querySelector('.spinner-border');
          return !waitText && !spinner;
        },
        { timeout: 30000 } // Đợi tối đa 30 giây
      );
      console.log("Trang đã sẵn sàng, tiếp tục thực hiện các bước...");
    } catch (waitError) {
      console.log("Đã hết thời gian chờ trang loading, thử tiếp tục...");
    }

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

    // Click button và đợi navigation
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }),
      button.click()
    ]);

    console.log("Đã bấm nút đăng ký thành công");
  } catch (error) {
    console.log("Chọn đăng ký cho tôi lỗi:", error.message);
  }
}

module.exports = {
  clickRegisterForMe,
};
