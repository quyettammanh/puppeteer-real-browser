async function gotoPage(page, url, timeout = 30000, retries = 1) {
  console.log(`Đang truy cập ${url}`);
  let attempt = 0;
  while (attempt < retries) {
    try {
      // Đặt timeout dài hơn cho network idle
      await page.setDefaultNavigationTimeout(timeout);
      await page.setDefaultTimeout(timeout);

      // Thử navigate với nhiều điều kiện load khác nhau
      const response = await Promise.race([
        page.goto(url, {
          timeout: timeout,
          waitUntil: "domcontentloaded",
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Navigation timeout")), timeout)
        ),
      ]);

      // Kiểm tra response
      if (!response) {
        console.log(`Không nhận được response từ ${url}`);
        attempt++;
        continue;
      }

      // Kiểm tra status code
      const status = response.status();
      if (status === 200) {
        console.log(`Đã vào trang thành công: ${response.url()}`);
        return response;
      } else {
        attempt++;
      }
    } catch (error) {
      // Phân loại lỗi để xử lý phù hợp
      if (error.name === "TimeoutError") {
        console.log("Lỗi timeout");
      } else if (error.message.includes("ERR_TUNNEL_CONNECTION_FAILED")) {
        console.log("Lỗi kết nối proxy - thử proxy khác");
      } else if (error.message.includes("ERR_CONNECTION_REFUSED")) {
        console.log("Server từ chối kết nối - có thể đã bị chặn");
      }

      // Thêm delay ngắn trước khi thử lại
      await new Promise((r) => setTimeout(r, 2000));
      attempt++;
    }
  }
  return null;
}

module.exports = {
  gotoPage,
};
