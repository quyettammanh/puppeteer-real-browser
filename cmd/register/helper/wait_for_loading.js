/**
 * Hàm đợi cho spinner loading và thông báo "XIN CHỜ TRONG GIÂY LÁT" biến mất
 * @param {Object} page - Puppeteer page object
 * @param {Object} options - Các tùy chọn
 * @param {number} options.timeout - Thời gian tối đa đợi (ms)
 * @param {string} options.loadingText - Văn bản loading cần kiểm tra
 * @param {string} options.spinnerSelector - CSS selector cho spinner
 * @param {boolean} options.logEnabled - Bật/tắt logging
 * @returns {Promise<boolean>} - true nếu trang đã sẵn sàng, false nếu hết thời gian
 */
async function waitForLoadingComplete(page, options = {}) {
  const {
    timeout = 3000,
    loadingText = "XIN CHỜ TRONG GIÂY LÁT",
    spinnerSelector = '.spinner-border',
    logEnabled = true
  } = options;

  const log = logEnabled ? console.log : () => {};

  try {
    await page.waitForFunction(
      (text, selector) => {
        // Kiểm tra text loading
        const hasLoadingText = document.body.innerText.includes(text);
        // Kiểm tra spinner loading
        const hasSpinner = document.querySelector(selector);
        // Trả về true khi cả hai đều biến mất
        return !hasLoadingText && !hasSpinner;
      },
      { timeout },
      loadingText,
      spinnerSelector
    );
    
    log("Trang đã sẵn sàng, tiếp tục thực hiện các bước...");
    return true;
  } catch (waitError) {
    log(`Đã hết thời gian chờ trang loading (${timeout}ms), thử tiếp tục...`);
    return false;
  }
}

module.exports = {
  waitForLoadingComplete,
}; 