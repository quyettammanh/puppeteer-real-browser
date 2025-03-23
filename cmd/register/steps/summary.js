async function stepSummary(page) {
    try{
        console.log("Xử lý bước summary");
        await stepConfirmDone(page);

    }catch(error){
        console.error("Error in stepSummary:", error);
    }

}

async function stepConfirmDone(page) {
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



module.exports = {
    stepSummary,
}