const { userInputLoop } = require('../../../utils/func');
const { clickButtonContinue } = require('../helper/click_continue');
const { waitForLoadingComplete } = require('../helper/wait_for_loading');

async function stepPayment(page) {
    try {
        console.log("Payment");
        
        // Đợi cho trang loading biến mất
        await waitForLoadingComplete(page);
        
        // await userInputLoop();
        await clickButtonContinue(page);
    } catch (error) {
        if (!error.message.includes('Target page, context or browser has been closed')) {
            console.error("Error in stepPayment:", error);
        }
        throw error; // Re-throw lỗi để handler xử lý
    }
}

module.exports = {
    stepPayment,
};