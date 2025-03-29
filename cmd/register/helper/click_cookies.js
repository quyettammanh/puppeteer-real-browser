async function acceptCookies(page, retries = 5, waitTime = 5000) {
    let attempt = 0;
    let isCookieAccepted = false;
    
    while (attempt < retries && !isCookieAccepted) {
      try {
        const cookieBanner = await page.$("#usercentrics-root");
        if (cookieBanner) {
          const shadowRoot = await page.evaluateHandle(
            (el) => el.shadowRoot,
            cookieBanner
          );
          const acceptButton = await shadowRoot.$(
            "[data-testid=uc-accept-all-button]"
          );
          if (acceptButton) {
            await acceptButton.click();
            isCookieAccepted = true;
            console.log("Cookies đã được chấp nhận.");
          } else {
            // console.log("Không có thông báo cookies.");
            isCookieAccepted = true; // Không có nút accept, coi như đã xử lý
          }
        } else {
          // console.log("Phần tử thông báo cookies không xuất hiện.");
          isCookieAccepted = true; // Không có cookie banner, coi như đã xử lý
        }
      } catch (error) {
        console.error(`Lỗi khi kiểm tra thông báo cookies: ${error.message}`);
      }
      attempt += 1;
      
      // Tránh lặp vô nghĩa nếu không có cookie banner
      if (!isCookieAccepted && attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Đợi 1 giây trước khi thử lại
      }
    }
    
    return isCookieAccepted;
  }

module.exports = {
    acceptCookies,
};