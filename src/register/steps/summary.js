// Import the sendTelegramMessage function
const { sendTelegramMessage } = require('../../utils/notification_tele')
const { takeScreenshot, randomTime, userInputLoop } = require('../../utils/func');
const { waitForLoadingComplete } = require('../helper/wait_for_loading');

async function stepSummary(page, user, endStep = 'success') {
    try {
        console.log("endStep",endStep);
        console.log("Xử lý bước summary");
        await userInputLoop();
        
        // Đợi cho trang loading biến mất
        await waitForLoadingComplete(page);
        
        // Thêm xử lý trước khi thực hiện stepConfirmDone hoặc stopSummaryandSendTele
        // Kiểm tra các phần tử trên trang summary
        const summaryContent = await page.evaluate(() => {
            return document.body.innerText;
        });
        
        // Ghi log thông tin summary
        console.log(`Summary page for ${user.email}: Page loaded`);
        if (endStep === 'success') {
            await stepConfirmDone(page, user);
        } else {
            await stopSummaryandSendTele(page, user);
        }
        return true;
    } catch (error) {
        console.error(`Error in stepSummary for ${user.email}:`, error.message);
        
        // Chụp hình màn hình lỗi
        try {
            await takeScreenshot(page, user, {
                fullPage: true,
                createDateFolder: true,
                fileName: `summary_error_${Date.now()}.png`,
            });
            
            // Gửi thông báo lỗi qua Telegram nếu có
            try {
                await sendTelegramMessage(`❌ Lỗi ở bước Summary cho ${user.email}: ${error.message}`);
            } catch (teleError) {
                console.error("Không thể gửi thông báo Telegram:", teleError);
            }
        } catch (screenshotError) {
            console.error("Không thể chụp màn hình lỗi:", screenshotError);
        }
        
        // Re-throw lỗi để handler bên ngoài xử lý
        throw error;
    }
}

async function stepConfirmDone(page, user) {
    try {
        console.log("Đã kiểm tra thông tin");
        
        // Đợi cho trang loading biến mất
        await waitForLoadingComplete(page, {
            logEnabled: false
        });
        
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
                return new Promise(resolve => setTimeout(resolve, 3000));
            }, isDev);

            // Bấm nút và đợi điều hướng trang
            console.log("Bấm nút thanh toán và đợi tải trang...");
            
            try {
                // Cách an toàn hơn khi xử lý điều hướng trong Puppeteer
                const navigationPromise = page.waitForNavigation({ 
                    timeout: 30000,
                    // waitUntil: 'networkidle0'
                });
                
                await page.click(cssSelector);
                await randomTime(10,20);
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

async function stopSummaryandSendTele(page, user) {
    try {
        console.log(`Stopping at summary step for ${user.email} and sending Telegram notification`);
        
        // Chụp màn hình để gửi Telegram
        const screenshotPath = await takeScreenshot(page, user, {
            fullPage: true,
            createDateFolder: true,
            fileName: `summary_stop_${Date.now()}.png`,
            returnPath: true
        });
        
        // Gửi thông báo Telegram
        const message = `✅ Đã hoàn thành đến bước Summary cho ${user.email}`;
        await sendTelegramMessage(message, screenshotPath);
        
        console.log(`Telegram notification sent for ${user.email}`);
    } catch (error) {
        console.error(`Error in stopSummaryandSendTele for ${user.email}:`, error);
        throw error;
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

module.exports = {
    stepSummary,
}