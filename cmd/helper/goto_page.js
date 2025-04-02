const { takeScreenshot } = require('./func');

/**
 * Truy cập trang web với xử lý lỗi và thử lại tự động
 * @param {Object} page - Puppeteer page object
 * @param {String} url - URL cần truy cập
 * @param {Object} options - Tùy chọn cấu hình
 * @returns {Promise<Response|null>} - Response từ trang hoặc null nếu thất bại
 */

async function gotoPage(page, url, options = {}) {
  // Cấu hình mặc định
  const config = {
    waitUntil: options.waitUntil || "domcontentloaded", // networkidle0, networkidle2, load, domcontentloaded
    logLevel: options.logLevel || 'info', // debug, info, error
    timeout: options.timeout || 30000, // Thêm timeout 5s

  };

  // Các status code hợp lệ
  const validStatusCodes = options.validStatusCodes || [200];
  
  console.log(`Đang truy cập ${url}`);
  
  try {
    // Thực hiện navigate
    const response = await page.goto(url, {
      waitUntil: config.waitUntil,
      timeout: config.timeout
    });

    // Kiểm tra response
    if (!response) {
      throw new Error("Không nhận được response từ server");
    }

    // Kiểm tra status code
    const status = response.status();
    if (validStatusCodes.includes(status)) {
      console.log(`Đã vào trang thành công: ${response.url()} (${status})`);
      return response;
    } else {
      throw new Error(`Status code không hợp lệ: ${status}`);
    }
  } catch (error) {
    // Phân loại và xử lý các loại lỗi khác nhau
    let errorType = "unknown";
    
    if (error.name === "TimeoutError" || error.message.includes("timeout")) {
      errorType = "timeout";
      console.log(`Lỗi timeout: ${error.message}`);
    } else if (error.message.includes("ERR_TUNNEL_CONNECTION_FAILED")) {
      errorType = "proxy";
      console.log("Lỗi kết nối proxy");
    } else if (error.message.includes("ERR_CONNECTION_REFUSED")) {
      errorType = "connection_refused";
      console.log("Server từ chối kết nối - có thể đã bị chặn");
    } else if (error.message.includes("ERR_NAME_NOT_RESOLVED")) {
      errorType = "dns";
      console.log("Không thể phân giải tên miền - kiểm tra DNS");
    } else if (error.message.includes("ERR_INTERNET_DISCONNECTED")) {
      errorType = "internet";
      console.log("Mất kết nối internet");
    } else if (error.message.includes("Navigation timeout")) {
      errorType = "navigation_timeout";
      console.log("Trang tải quá lâu");
    } else if (error.message.includes("net::ERR_ABORTED")) {
      errorType = "aborted";
      console.log("Điều hướng bị gián đoạn");
    } else if (error.message.includes("Status code không hợp lệ")) {
      errorType = "status_code";
      console.log(error.message);
    } else {
      console.log(`Lỗi không xác định: ${error.message}`);
    }
    
    console.error(`Không thể truy cập ${url}. Lỗi: ${errorType}`);
    return null;
  }
}

module.exports = { gotoPage };
