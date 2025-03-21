const {randomTime} = require('../../helper/func.js');
async function cancellBooking(page) {
    try {
        const cancelButton = page.locator('//button[contains(text(), "Hủy đăng kí giữ chỗ khác")]');
        const isVisible = await Promise.race([
            cancelButton.isVisible(),
            new Promise((resolve) => setTimeout(() => resolve(false), 3000)) // Giảm timeout xuống 1 giây
        ]).catch(() => false);
        if (isVisible) {
            await cancelButton.click();
            await randomTime(3,4); // Giữ nguyên, nhưng xem xét tối ưu hàm này
            console.log("Đã huỷ giữ chỗ thành công");
        }
    } catch (error) {
        console.log("Bỏ qua bước huỷ giữ chỗ");
    }
}

module.exports = { cancellBooking };