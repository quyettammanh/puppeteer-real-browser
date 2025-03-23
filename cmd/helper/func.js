const fs = require('fs');
const path = require('path');
const { sendImageToTelegram } = require('../utils/notification_tele.js');

// Hàm để nhận đầu vào từ người dùng (có thể giả lập)
async function userInputLoop() {
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

// Function to read JSON file
function readFileJson(filePath) {
    if (!fs.existsSync(filePath)) {
        console.error(`File ${filePath} không tồn tại.`);
        return null;
    }
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
}

// function to generate random delay
async function randomTime(min = 1, max = 5) {
    // Generate a random delay between 1 and 2 seconds
    const delayInSeconds = Math.random() * (max - min) + min; // Random float between 1 and 5
    const delayInMilliseconds = delayInSeconds * 1000; // Convert to milliseconds
    // Pause execution for the specified delay
    await new Promise(resolve => setTimeout(resolve, delayInMilliseconds));
}

// Hàm chụp ảnh trang web và lưu với tên theo format
async function takeScreenshot(page, user, options = {}) {
    try {
        // Mặc định các tùy chọn
        const {
            fullPage = true,
            quality = 80,
            format = 'png',
            createDateFolder = true,
            showUrl = false,
            urlBarHeight = 30,
            urlBarPosition = 'top', // 'top' hoặc 'bottom'
            urlBarBgColor = '#000000',
            urlBarTextColor = '#ffffff'
        } = options;
        
        // Tạo thư mục gốc nếu không tồn tại
        const baseDir = path.join(process.cwd(), 'cmd/data/img');
        if (!fs.existsSync(baseDir)) {
            fs.mkdirSync(baseDir, { recursive: true });
        }
        
        // Tạo subfolder theo ngày nếu được yêu cầu
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0]; // Format YYYY-MM-DD
        let screenshotDir = baseDir;
        
        if (createDateFolder) {
            screenshotDir = path.join(baseDir, dateStr);
            if (!fs.existsSync(screenshotDir)) {
                fs.mkdirSync(screenshotDir, { recursive: true });
            }
        }
        
        // Tạo tên file với format: email người dùng + ngày giờ hiện tại
        const timestamp = now.toISOString().replace(/:/g, '-').replace(/\..+/, '');
        const fileName = `${user.email}_${timestamp}.${format}`;
        const filePath = path.join(screenshotDir, fileName);
        
        // Lấy URL hiện tại
        const currentUrl = page.url();
        
        // Nếu yêu cầu hiển thị URL, thêm thanh URL tạm thời vào trang
        let originalBodyMargin = null;
        if (showUrl) {
            // Lưu lại style ban đầu để khôi phục sau khi chụp
            originalBodyMargin = await page.evaluate(() => document.body.style.margin);
            
            // Thêm thanh URL vào trang
            await page.evaluate(
                ({ currentUrl, urlBarHeight, urlBarPosition, urlBarBgColor, urlBarTextColor }) => {
                    // Tạo element hiển thị URL
                    const urlBar = document.createElement('div');
                    urlBar.id = 'screenshot-url-bar';
                    urlBar.style.position = 'fixed';
                    urlBar.style.left = '0';
                    urlBar.style.right = '0';
                    urlBar.style.height = `${urlBarHeight}px`;
                    urlBar.style[urlBarPosition] = '0';
                    urlBar.style.backgroundColor = urlBarBgColor;
                    urlBar.style.color = urlBarTextColor;
                    urlBar.style.padding = '5px 10px';
                    urlBar.style.zIndex = '2147483647'; // Giá trị z-index cao nhất
                    urlBar.style.display = 'flex';
                    urlBar.style.alignItems = 'center';
                    urlBar.style.fontFamily = 'Arial, sans-serif';
                    urlBar.style.fontSize = '14px';
                    
                    // Hiển thị URL đầy đủ
                    urlBar.textContent = `URL: ${currentUrl}`;
                    
                    // Thêm vào body
                    document.body.appendChild(urlBar);
                    
                    // Điều chỉnh margin cho body để tránh che nội dung
                    if (urlBarPosition === 'top') {
                        document.body.style.marginTop = `${urlBarHeight}px`;
                    } else {
                        document.body.style.marginBottom = `${urlBarHeight}px`;
                    }
                },
                { currentUrl, urlBarHeight, urlBarPosition, urlBarBgColor, urlBarTextColor }
            );
        }
        
        // Cấu hình tùy chọn chụp màn hình
        const screenshotOptions = {
            path: filePath,
            fullPage,
            type: format,
            quality: format === 'jpeg' ? quality : undefined
        };
        
        // Chụp và lưu ảnh
        await page.screenshot(screenshotOptions);
        
        // Xóa thanh URL sau khi chụp xong
        if (showUrl) {
            await page.evaluate((originalBodyMargin) => {
                const urlBar = document.getElementById('screenshot-url-bar');
                if (urlBar) {
                    urlBar.remove();
                }
                // Khôi phục style ban đầu
                document.body.style.margin = originalBodyMargin;
            }, originalBodyMargin);
        }
        
        console.log(`Đã chụp màn hình và lưu tại: ${filePath}`);
        await sendImageToTelegram(filePath);
        
        return filePath;
    } catch (error) {
        console.error(`Lỗi khi chụp màn hình: ${error.message}`);
        return null;
    }
}

module.exports = {
    userInputLoop,
    randomTime,
    readFileJson,
    takeScreenshot,
}