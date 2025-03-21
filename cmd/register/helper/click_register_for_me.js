async function clickRegisterForMe(page) {
  try {
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

    // Click button
    await button.click();

    console.log("Đã bấm nút đăng ký thành công");
  } catch (error) {
    console.log("Chọn đăng ký cho tôi lỗi:", error.message);
  }
}

module.exports = {
  clickRegisterForMe,
};
