const {randomTime} = require('../../../utils/func');
const {waitForLoadingComplete} = require('./wait_for_loading.js');

async function clickButtonContinue(page) {
  try {
      // Đợi cho trang loading biến mất
      await waitForLoadingComplete(page, {
          logEnabled: false, 
          timeout: 10000
      });

      // Tìm button dựa trên selector (giả sử button có text 'tiếp tục')
      const buttons = await page.$$('button'); // Lấy tất cả các button
      let buttonToClick;

      // Lọc button có chứa text 'tiếp tục' (không phân biệt hoa thường)
      const matchingButtons = [];
      for (const button of buttons) {
          const text = await page.evaluate(el => el.textContent.trim().toLowerCase(), button);
          if (text.includes('tiếp tục')) {
              matchingButtons.push(button);
          }
      }

      // Đợi button đầu tiên xuất hiện trong vòng 1.5 giây
      await page.waitForFunction(
          () => Array.from(document.querySelectorAll('button'))
              .some(btn => btn.textContent.trim().toLowerCase().includes('tiếp tục')),
          { timeout: 1500 }
      );

      // Kiểm tra số lượng button tìm thấy
      const count = matchingButtons.length;
      if (count === 0) {
          console.log("Không tìm thấy nút tiếp tục");
          return;
      }

      // Chọn button để click
      if (count >= 2) {
          buttonToClick = matchingButtons[1]; // Chọn button thứ hai
        //   console.log("Đã tìm thấy nhiều hơn 1 nút 'tiếp tục', chọn nút thứ hai.");
      } else {
          buttonToClick = matchingButtons[0]; // Chọn button đầu tiên
      }

      // Click vào button
      await buttonToClick.click({ force: true });

      // Đợi trang load với timeout tối đa 3 giây hoặc tổng timeout 10 giây
      await Promise.race([
          page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 3000 }).catch(() => {}),
          new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Click operation timeout')), 10000)
          ),
      ]);

      console.log("Đã click và load trang hoàn tất");
      
      // Đợi cho trang mới loading biến mất nếu có
      await waitForLoadingComplete(page, {
          logEnabled: false, 
          timeout: 5000
      });

      // Delay ngẫu nhiên từ 1 đến 2 giây
      await randomTime(1, 2);

  } catch (e) {
      console.log("Lỗi khi click button tiếp tục:", e.message);
      throw e; // Ném lại lỗi để caller xử lý
  }
}

module.exports = {
  clickButtonContinue,
};