const { randomTime } = require("../../../utils/func");

async function cancellBooking(page) {
    try {
    //   console.log("Huỷ giữ chỗ");
    //   console.log("Đang chờ nút huỷ giữ chỗ xuất hiện...");
  
      // Tìm và nhấp vào nút bằng evaluate
      const buttonFound = await page.evaluate(() => {
        // Tìm tất cả các button
        const buttons = Array.from(document.querySelectorAll('button'));
        // Tìm button có text phù hợp
        const cancelButton = buttons.find(button => 
          button.textContent.includes("Hủy đăng kí giữ chỗ khác")
        );
        
        // Nếu tìm thấy, click vào nút đó
        if (cancelButton) {
          cancelButton.click();
          return true;
        }
        return false;
      });
  
      if (buttonFound) {
        await randomTime(1, 2);
        // console.log("Đã huỷ giữ chỗ thành công");
      } else {
        // console.log("Không tìm thấy nút huỷ giữ chỗ");
      }
    } catch (error) {
    //   console.log("Lỗi khi huỷ giữ chỗ:", error);
    }
  }
  

async function getActiveStepText(page, maxRetries = 2) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Wait for selector with timeout
      const activeStep = await page.waitForSelector(
        ".cs-progress-bar__step--active",
        {
          timeout: 3000,
          state: "visible",
        }
      );

      if (activeStep) {
        const text = await activeStep.textContent();
        console.log(`Bước hiện tại: ${text.trim().toLowerCase()}`);
        return text.trim().toLowerCase();
      }
    } catch (error) {
      console.log(
        "Không tìm thấy bước hiện tại, thử lại...",
        error,
        page.url()
      );
      if (attempt === maxRetries - 1) {
        return null;
      }
    }
  }
}
module.exports = {
  cancellBooking,
  getActiveStepText,
};
