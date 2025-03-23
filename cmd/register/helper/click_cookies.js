
async function acceptCookies(page, retries = 5, waitTime = 5000) {
    let attempt = 0;
    while (attempt < retries) {
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
          } else {
            // console.log("Không có thông báo cookies.");
          }
        } else {
          // console.log("Phần tử thông báo cookies không xuất hiện.");
        }
      } catch (error) {
        // console.error(`Lỗi khi kiểm tra thông báo cookies: ${error.message}`);
      }
      attempt += 1;
    }
  }

module.exports = {
    acceptCookies,
};