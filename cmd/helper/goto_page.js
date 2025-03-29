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

// async function gotoPage(page, url, options = {}) {
//   // Cấu hình mặc định
//   const config = {
//     timeout: options.timeout || 30000,
//     retries: options.retries || 3,
//     waitUntil: options.waitUntil || "domcontentloaded", // networkidle0, networkidle2, load, domcontentloaded
//     initialBackoff: options.initialBackoff || 2000, // 2 giây ban đầu
//     maxBackoff: options.maxBackoff || 10000, // tối đa 10 giây
//     // takeScreenshotOnError: options.takeScreenshotOnError !== undefined ? options.takeScreenshotOnError : true,
//     // user: options.user || { email: 'system' }, // Người dùng mặc định cho screenshot
//     logLevel: options.logLevel || 'info', // debug, info, error
//   };

//   // Các status code hợp lệ
//   const validStatusCodes = options.validStatusCodes || [200];
  
//   console.log(`Đang truy cập ${url} (timeout: ${config.timeout}ms, retries: ${config.retries})`);
  
//   let attempt = 0;
//   let lastError = null;
  
//   while (attempt < config.retries) {
//     try {
//       // Tính toán thời gian backoff với exponential backoff
//       if (attempt > 0) {
//         const backoffTime = Math.min(
//           config.initialBackoff * Math.pow(2, attempt - 1),
//           config.maxBackoff
//         );
        
//         // Thêm jitter (±20%) để tránh nhiều request cùng lúc
//         const jitter = 0.8 + (Math.random() * 0.4); // 0.8-1.2
//         const actualBackoff = Math.floor(backoffTime * jitter);
        
//         console.log(`Thử lại lần ${attempt + 1}/${config.retries} sau ${actualBackoff}ms...`);
//         await new Promise(r => setTimeout(r, actualBackoff));
//       }

//       // Cấu hình timeout
//       await page.setDefaultNavigationTimeout(config.timeout);
//       await page.setDefaultTimeout(config.timeout);

//       // Theo dõi thời gian bắt đầu
//       const startTime = Date.now();
      
//       // Thực hiện navigate với timeout ngắn hơn để xử lý chủ động
//       const response = await Promise.race([
//         page.goto(url, {
//           timeout: config.timeout * 0.9, // Giảm 10% để có thời gian xử lý lỗi
//           waitUntil: config.waitUntil,
//         }),
//         new Promise((_, reject) => setTimeout(() => 
//           reject(new Error(`Navigation timeout after ${config.timeout * 0.9}ms`)), 
//           config.timeout * 0.9)
//         ),
//       ]);

//       // Đo thời gian tải trang
//       const loadTime = Date.now() - startTime;

//       // Kiểm tra response
//       if (!response) {
//         throw new Error("Không nhận được response từ server");
//       }

//       // Kiểm tra status code
//       const status = response.status();
//       if (validStatusCodes.includes(status)) {
//         console.log(`Đã vào trang thành công: ${response.url()} (${status}) trong ${loadTime}ms`);
//         return response;
//       } else {
//         throw new Error(`Status code không hợp lệ: ${status}`);
//       }
//     } catch (error) {
//       lastError = error;
//       attempt++;
      
//       // Phân loại và xử lý các loại lỗi khác nhau
//       let errorType = "unknown";
//       let errorSeverity = "warning";
      
//       if (error.name === "TimeoutError" || error.message.includes("timeout")) {
//         errorType = "timeout";
//         console.log(`Lỗi timeout: ${error.message}`);
//       } else if (error.message.includes("ERR_TUNNEL_CONNECTION_FAILED")) {
//         errorType = "proxy";
//         console.log("Lỗi kết nối proxy - thử proxy khác");
//       } else if (error.message.includes("ERR_CONNECTION_REFUSED")) {
//         errorType = "connection_refused";
//         console.log("Server từ chối kết nối - có thể đã bị chặn");
//         errorSeverity = "error";
//       } else if (error.message.includes("ERR_NAME_NOT_RESOLVED")) {
//         errorType = "dns";
//         console.log("Không thể phân giải tên miền - kiểm tra DNS");
//         errorSeverity = "error";
//       } else if (error.message.includes("ERR_INTERNET_DISCONNECTED")) {
//         errorType = "internet";
//         console.log("Mất kết nối internet");
//         errorSeverity = "error";
//       } else if (error.message.includes("Navigation timeout")) {
//         errorType = "navigation_timeout";
//         console.log("Trang tải quá lâu");
//       } else if (error.message.includes("net::ERR_ABORTED")) {
//         errorType = "aborted";
//         console.log("Điều hướng bị gián đoạn");
//       } else if (error.message.includes("Status code không hợp lệ")) {
//         errorType = "status_code";
//         console.log(error.message);
//       } else {
//         console.log(`Lỗi không xác định: ${error.message}`);
//       }
      
//       // Chụp ảnh nếu được cấu hình và có người dùng
//       if (config.takeScreenshotOnError && config.user) {
//         try {
//           const fileName = `error_${errorType}_attempt${attempt}`;
//           await takeScreenshot(page, config.user, { 
//             fullPage: true, 
//             showUrl: true,
//             createDateFolder: true,
//             fileName: fileName
//           });
//           console.log(`Đã chụp ảnh lỗi: ${fileName}`);
//         } catch (screenshotError) {
//           console.error(`Không thể chụp ảnh lỗi: ${screenshotError.message}`);
//         }
//       }
      
//       // Nếu lỗi nghiêm trọng, có thể dừng thử lại sớm
//       if (errorSeverity === "error" && attempt < config.retries) {
//         console.log(`Lỗi nghiêm trọng, giảm số lần thử lại còn ${config.retries - attempt}`);
//       }
//     }
//   }
  
//   // Thất bại sau tất cả các lần thử
//   console.error(`Không thể truy cập ${url} sau ${config.retries} lần thử.`);
//   if (lastError) {
//     console.error(`Lỗi cuối cùng: ${lastError.message}`);
//   }
//   return null;
// }

module.exports = { gotoPage };
