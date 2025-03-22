const fs = require('fs');
const path = require('path');

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
async function takeScreenshot(page, user) {
    // Tạo thư mục nếu không tồn tại
    const screenshotDir = path.join(process.cwd(), 'cmd/data/img');
    if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true });
    }
    
    // Tạo tên file với format: tên người dùng + ngày giờ hiện tại
    const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
    const fileName = `${user.email}_${timestamp}.png`;
    const filePath = path.join(screenshotDir, fileName);
    
    // Chụp và lưu ảnh
    await page.screenshot({ path: filePath, fullPage: true });
    console.log(`Đã chụp màn hình và lưu tại: ${filePath}`);
    
    return filePath;
}

module.exports = {
    userInputLoop,
    randomTime,
    readFileJson,
    takeScreenshot,
}