const checkGoetheErrors = async (page, user) => {
    try {
        const url = page.url();
        const errorPatterns = [
            { pattern: 'account-locked-error', message: "Account locked, exiting..." },
            { pattern: 'underage-error', message: "Underage, exiting..." },
            { pattern: 'session-expired', message: "Session expired, exiting..." },
            { pattern: 'account-temp-pairing-error', message: "Account temp pairing error, exiting..." },
            { pattern: 'warning', message: "Warning, exiting..." },
            { pattern: 'error', message: "General error detected, exiting..." }
        ];
        
        // Trường hợp đặc biệt cho chrome error
        if (url.includes('chrome-error://chromewebdata')) {
            console.error(`${user.email}: Chrome error, reloading...`);
            await page.reload();
            return false;
        }
        
        // Kiểm tra các pattern lỗi khác
        for (const { pattern, message } of errorPatterns) {
            if (url.includes(pattern)) {
                // Lấy thêm thông tin từ page nếu có thể
                let errorDetails = "";
                try {
                    errorDetails = await page.evaluate(() => {
                        const errorElement = document.querySelector('.error-message, .alert-danger, .alert-warning');
                        return errorElement ? errorElement.textContent.trim() : "";
                    });
                } catch (evalError) {
                    // Không làm gì nếu không đọc được thông tin lỗi
                }
                
                const detailMessage = errorDetails ? `${message} Details: ${errorDetails}` : message;
                console.error(`${user.email}: ${detailMessage} (URL: ${url})`);
                
                return {
                    isError: true,
                    errorType: pattern,
                    message: detailMessage,
                    url: url
                };
            }
        }
        
        return false;
    } catch (error) {
        console.error(`Error checking Goethe errors for ${user.email}: ${error.message}`);
        return false; // Trả về false nếu có lỗi trong quá trình kiểm tra
    }
};

module.exports = {
    checkGoetheErrors,
};