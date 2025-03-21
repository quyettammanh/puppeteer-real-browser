async function stepLogin(page, user) {
  try {
    console.log("Login");
    const emailInput = await page.$("#username");
    await emailInput.click({ clickCount: 3 }); 
    await emailInput.type(user.email);
    const passwordInput = await page.$("#password");
    await passwordInput.click({ clickCount: 3 });
    await passwordInput.type(user.password);
    await page.keyboard.press("Enter");
    console.log("Đăng nhập thành công (dùng input + CSS selector + id)");
  } catch (error) {
    console.error("Error in stepLogin:", error);
  }
}

module.exports = {
  stepLogin,
};