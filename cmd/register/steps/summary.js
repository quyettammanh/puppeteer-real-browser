async function stepSummary(page, user) {
    try{
        console.log("Xử lý bước summary");
        await stepConfirmDone(page, user);
        return true;
    }catch(error){
        console.error("Error in stepSummary:", error);
        return false;
    }

}
async function stepConfirmDone(page, user) {
    // gửi tạo link chứa cookies để gửi đến telegram
    try {
        console.log("Chuẩn bị gửi link chứa cookies đến Telegram");
        await stopRegisterAndSendTele(page, user);
        return true;
    } catch (error) {
        console.error("Error in stepConfirmDone while sending to Telegram:", error);
    }
}

async function stopRegisterAndSendTele(page, user) {
    console.log("🚀 Đã dừng đăng ký và gửi thông báo");
    const urlSuccess = await createLinkSendTele(page);

    // Check if URL contains error or warning
    if (!urlSuccess.toLowerCase().includes('error') && !urlSuccess.toLowerCase().includes('warning')) {
        await sendTelegramMessage(`🚀 ${user?.email || 'User'} cần xử lý thủ công: ${urlSuccess}`);
        console.log("🚀 Đã gửi thông báo cho telegram");
    } else {
        console.log("❌ Không gửi thông báo do URL chứa error hoặc warning");
    }
}

async function createLinkSendTele(page) {
    try {
        // Bước 1: Lấy URL hiện tại của trang
        const currentUrl = page.url();
        console.log("\n🌐 Current URL:", currentUrl);

        // Bước 2: Lấy tất cả cookies từ trang
        const cookies = await page.evaluate(() => {
            return document.cookie.split(';').map(cookie => {
                const [name, value] = cookie.trim().split('=');
                return { name, value };
            });
        });
        // Bước 3: Tạo URL mới chứa cookies
        const urlWithCookies = addCookiesToUrl(currentUrl, cookies);
        console.log("\n🔗 URL with cookies:", urlWithCookies);

        // Trả về URL chứa cookies
        return urlWithCookies;
    } catch (error) {
        console.error("\n❌ Error in createLinkConfirm:", error);
        throw error;
    }
}

// Hàm hỗ trợ: Thêm cookies vào URL dưới dạng query parameters
function addCookiesToUrl(url, cookies) {
    const urlObj = new URL(url);

    // Thêm từng cookie vào URL dưới dạng query parameters
    cookies.forEach(cookie => {
        urlObj.searchParams.append(cookie.name, cookie.value);
    });

    return urlObj.toString();
}

// async function createLinkSendTele(page) {
//     try {
//         // Bước 1: Lấy URL hiện tại của trang
//         const currentUrl = page.url();
//         console.log("\n🌐 Current URL:", currentUrl);

//         // Bước 2: Lấy tất cả cookies từ trang
//         const cookies = await page.cookies();
//         console.log("\n🍪 Got cookies, count:", cookies.length);
        
//         // Bước 3: Tạo URL mới chứa cookies
//         const urlWithCookies = addCookiesToUrl(currentUrl, cookies);
//         console.log("\n🔗 URL with cookies:", urlWithCookies);

//         // Trả về URL chứa cookies
//         return urlWithCookies;
//     } catch (error) {
//         console.error("\n❌ Error in createLinkConfirm:", error);
//         return "error: " + error.message;
//     }
// }

// function addCookiesToUrl(url, cookies) {
//     // Create a new URL object from the original URL
//     const urlObj = new URL(url);
    
//     // Add each cookie as a query parameter
//     cookies.forEach(cookie => {
//         if (cookie.name && cookie.value) {
//             // Encode the cookie name and value to ensure they are URL-safe
//             urlObj.searchParams.append(
//                 encodeURIComponent(`cookie_${cookie.name}`),
//                 encodeURIComponent(cookie.value)
//             );
//         }
//     });
    
//     // Return the new URL as a string
//     return urlObj.toString();
// }

async function stepConfirmDone1(page) {
    try {
        console.log("Đã kiểm tra thông tin");
        
        // Sử dụng CSS selector thay vì XPath
        const cssSelector = 'button.cs-button--arrow_next';
        console.log("Đang chờ nút thanh toán xuất hiện...");
        
        try {
            // Đợi nút xuất hiện với timeout
            await page.waitForSelector(cssSelector, { visible: true, timeout: 10000 });
        } catch (timeoutError) {
            console.log("Hết thời gian chờ nút thanh toán xuất hiện");
            return false;
        }
        
        // Kiểm tra xem nút có tồn tại không
        const buttonExists = await page.$(cssSelector);
        
        if (buttonExists) {
            console.log("tìm thấy nút thanh toán");
            const isDev = process.env.NODE_ENV;

            // Sử dụng evaluate để scroll và đảm bảo nút có thể nhìn thấy
            await page.evaluate((isDev) => {
                const button = document.querySelector('button.cs-button--arrow_next');
                if (isDev !== 'development' && button) {
                    button.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                return new Promise(resolve => setTimeout(resolve, 300));
            }, isDev);

            // Bấm nút và đợi điều hướng trang
            console.log("Bấm nút thanh toán và đợi tải trang...");
            
            try {
                // Cách an toàn hơn khi xử lý điều hướng trong Puppeteer
                const navigationPromise = page.waitForNavigation({ 
                    timeout: 30000,
                    waitUntil: 'networkidle0'
                });
                
                await page.click(cssSelector);
                await navigationPromise;
                
                console.log("Đã bấm nút thanh toán và hoàn tất tải trang");
                return true;
            } catch (navigationError) {
                console.error("Lỗi khi điều hướng trang:", navigationError.message);
                return false;
            }
        } else {
            console.log("Không tìm thấy nút thanh toán");
            return false;
        }
    } catch (error) {
        if (!error.message.includes('Target page, context or browser has been closed')) {
            console.error("Error in stepConfirmDone:", error);
        }
        return false;
    }
}

// Import the sendTelegramMessage function
const { sendTelegramMessage } = require('../../utils/notification_tele');

module.exports = {
    stepSummary,
}