async function stepPayment(page) {
    try {
        console.log("Xử lý bước thanh toán");
        // // await page.pause();
        // console.log("Xử lý bước thanh toán");
        // await clickButtonContinue(page);
        // console.log("Đã bấm nút tiếp tục lần 1");
        // await randomTime(1, 2);
        // await clickButtonContinue(page);
        // console.log("Đã bấm nút tiếp tục lần 2");
    } catch (error) {
        // if (!error.message.includes('Target page, context or browser has been closed')) {
        //     console.error("Error in stepPayment:", error);
        // }
    }
}

module.exports = {
    stepPayment,
}