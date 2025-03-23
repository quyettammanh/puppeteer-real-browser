const { randomTime, userInputLoop } = require("../helper/func.js");
const { fightingForSlots } = require("./steps/fighting_slot.js");
const { stepChooseModule } = require("./steps/choose_module.js");
const { clickRegisterForMe } = require("./helper/click_register_for_me.js");
const { stepLogin } = require("./steps/login.js");
const { checkGoetheErrors } = require("./helper/goethe_err.js");
const { stepPayment } = require("./steps/payment.js");
const { stepInputData } = require("./steps/input_data_v2.js");
const {
  cancellBooking,
  getActiveStepText,
} = require("./helper/click_cancel_booking");
const { acceptCookies } = require("./helper/click_cookies");
const { stepSummary } = require("./steps/summary.js");
const { stepSuccess } = require("./steps/stepSuccess.js");
const { takeScreenshot } = require("../helper/func.js");

async function taskRegisterGoethe(
  browser,
  page,
  url,
  user,
  pathProxy,
  exam,
  browserId
) {
  try {
    const identifier = browserId || `user-${user.email.split("@")[0]}`;
    console.log(
      `Browser ${identifier}: Starting registration process for ${user.email}`
    );

    const newPage = await fightingForSlots(
      browser,
      page,
      url,
      pathProxy,
      identifier
    );
    if (newPage === null) {
      console.log(
        `Browser ${identifier}: Failed to access the initial page for ${user.email}`
      );
      return null;
    }

    await randomTime(1, 2);
    console.log(
      `Browser ${identifier}: Starting remaining steps for ${user.email}`
    );
    console.log("user đang chạy", user.email);
    // await randomTime(3,4);
    // return;

    // await userInputLoop();

    // Use identifier for better tracking
    await handleRemainingSteps(newPage, user, exam, newPage.url(), identifier);

    console.log(`Browser ${identifier}: Process completed for ${user.email}`);
  } catch (error) {
    console.error(
      `Error in browser ${browserId} for ${user.email}: ${
        error.message || "Unknown error"
      }`
    );
  }
}

// Hàm xác định bước hiện tại dựa trên URL
async function getCurrentStep(page, identifier = "") {
  const currentUrl = page.url();

  // Map URL patterns to step names
  const urlStepMap = [
    { pattern: "coe/options", step: "choose_module" },
    { pattern: "coe/selection", step: "button_register_for_me" },
    { pattern: "login.goethe.de", step: "login" },
    { pattern: "coe/oska-acc", step: "personal_info" },
    { pattern: "child-acc", step: "child_acc" },
    { pattern: "booked-options", step: "study_goethe" },
    { pattern: "voucher", step: "voucher" },
    { pattern: "psp-selection", step: "psp_selection" },
    { pattern: "summary", step: "summary" },
    { pattern: "success", step: "success" },
  ];

  // Tìm bước dựa trên URL
  for (const { pattern, step } of urlStepMap) {
    if (currentUrl.includes(pattern)) {
      return step;
    }
  }

  // Nếu không tìm thấy, lấy bước từ văn bản trang
  const activeStep = await getActiveStepText(page);
  console.log(
    `Browser for ${identifier}: Unknown step from URL:`,
    currentUrl,
    "Active step text:",
    activeStep
  );
  return activeStep || "unknown";
}

// Hàm kiểm tra và cập nhật trạng thái hoàn thành bước
async function checkStepCompletion(
  page,
  user,
  currentStep,
  stepCompletionStatus,
  urlPattern,
  identifier = ""
) {
  const currentUrl = page.url();
  if (!currentUrl.includes(urlPattern)) {
    stepCompletionStatus[currentStep] = true;
    console.log(`Browser for ${user.email}: ✅ Completed: ${currentStep}`);
    return true;
  }
  return false;
}

async function handleRemainingSteps(
  page,
  user,
  exam,
  originUrl,
  identifier = ""
) {
  const maxAttempts = 20;
  const timeout = 6000000; // 10 minute all step
  const stepTimeout = 1200000; // 2 minute stuck in same step
  let attempts = 0;
  let startTime = Date.now();
  let lastStepTime = Date.now();
  let lastStep = "";
  let currentStep = "";

  // Add identifier prefix to all console logs
  const log = (message) => console.log(`Browser for ${user.email}: ${message}`);

  // Định nghĩa các bước và trạng thái hoàn thành
  let stepCompletionStatus = {
    choose_module: false,
    button_register_for_me: false,
    login: false,
    personal_info: false,
    child_acc: false,
    study_goethe: false,
    voucher: false,
    psp_selection: false,
    summary: false,
    success: false,
  };

  // Định nghĩa các xử lý cho từng bước
  const stepHandlers = {
    choose_module: async () => {
      log("📚 Starting: Choose module");
      await stepChooseModule(page, user);
      return checkStepCompletion(
        page,
        user,
        "choose_module",
        stepCompletionStatus,
        "options",
        identifier
      );
    },

    button_register_for_me: async () => {
      log("📝 Starting: Register for me");
      await clickRegisterForMe(page);
      const completed = await checkStepCompletion(
        page,
        user,
        "button_register_for_me",
        stepCompletionStatus,
        "coe/selection",
        identifier
      );
      if (completed) await randomTime(1, 2);
      return completed;
    },

    login: async () => {
      log("🔑 Starting: Login");
      await stepLogin(page, user);
      await randomTime(3, 4);
      return checkStepCompletion(
        page,
        user,
        "login",
        stepCompletionStatus,
        "login",
        identifier
      );
    },

    personal_info: async () => {
      log("👤 Starting: Personal Info");
      await stepInputData(page, user, exam);
      return checkStepCompletion(
        page,
        user,
        "personal_info",
        stepCompletionStatus,
        "oska-acc",
        identifier
      );
    },

    child_acc: async () => {
      log("👶 Starting: Child Account");
      // await stepInputData(page, user, exam);
      return checkStepCompletion(
        page,
        user,
        "child_acc",
        stepCompletionStatus,
        "child-acc",
        identifier
      );
    },

    study_goethe: async () => {
      log("📖 Starting: Study Goethe");
      // await stepPayment(page);
      return checkStepCompletion(
        page,
        user,
        "study_goethe",
        stepCompletionStatus,
        "booked-options",
        identifier
      );
    },

    voucher: async () => {
      log("🎫 Starting: Voucher");
      await stepPayment(page);
      return checkStepCompletion(
        page,
        user,
        "voucher",
        stepCompletionStatus,
        "voucher",
        identifier
      );
    },

    psp_selection: async () => {
      log("💳 Starting: PSP Selection");
      await stepPayment(page);
      return checkStepCompletion(
        page,
        user,
        "psp_selection",
        stepCompletionStatus,
        "psp-selection",
        identifier
      );
    },

    summary: async () => {
      log("📋 Starting: Summary");
      await stepSummary(page);
      return checkStepCompletion(
        page,
        user,
        "summary",
        stepCompletionStatus,
        "summary",
        identifier
      );
    },

    success: async () => {
      log("🎉 Starting: Success page");
      const result = await stepSuccess(page, user, log);
      if (result) {
        stepCompletionStatus.success = true;
      }
      return result;
    },
  };

  while (attempts < maxAttempts && Date.now() - startTime < timeout) {
    try {
      // Kiểm tra lỗi Goethe
      if (await checkGoetheErrors(page, user)) {
        // await takeScreenshot(page, user, { fullPage: true });
        await takeScreenshot(page, user, {
          fullPage: true,
          showUrl: true,
          urlBarPosition: "top",
        });
        return;
      }

      // Direct URL check for success page
      const currentUrl = page.url();
      if (currentUrl.includes('success') && !stepCompletionStatus.success) {
        log("🔍 Success pattern detected in URL: " + currentUrl);
        currentStep = "success";
      } else {
        // Regular step detection
        currentStep = await getCurrentStep(page, identifier);
      }
      
      log("Current step:", currentStep);

      // Special handling for success page detection
      if (currentStep === "success" && !stepCompletionStatus.success) {
        log("🎊 SUCCESS PAGE DETECTED! Processing final step...");
      }

      // Kiểm tra nếu bị kẹt ở một bước quá lâu
      if (currentStep === lastStep && Date.now() - lastStepTime > stepTimeout) {
        log(`Stuck in ${currentStep} for too long, refreshing...`);

        // Chụp màn hình trước khi làm mới trang
        await takeScreenshot(page, user, {
          fullPage: true,
          createDateFolder: true,
          fileName: `stuck_${currentStep}_${Date.now()}.png`,
        });

        await page.reload();
        lastStepTime = Date.now();
        attempts++;
        continue;
      }

      // Cập nhật theo dõi bước
      if (currentStep !== lastStep) {
        lastStep = currentStep;
        lastStepTime = Date.now();
      }

      // Xử lý các hành động chung cho tất cả các bước
      await acceptCookies(page);
      await cancellBooking(page);

      // Xử lý bước hiện tại nếu chưa hoàn thành
      const handler = stepHandlers[currentStep];
      if (handler && !stepCompletionStatus[currentStep]) {
        attempts = 0; // Reset attempts for valid steps
        await handler();
      } else if (!handler) {
        // Bước không xác định
        log("Unknown or unhandled step:");
        attempts++;
        await randomTime(3, 4);
      }

      // Kiểm tra xem đã hoàn thành tất cả các bước hay chưa
      const allStepsCompleted = Object.values(stepCompletionStatus).every(
        (status) => status
      ) || stepCompletionStatus.success; // Consider success as completion condition

      if (allStepsCompleted) {
        log("✅ All steps completed successfully!");
        // Final screenshot already taken in success handler if that's how we finished
        if (!stepCompletionStatus.success) {
          await takeScreenshot(page, user, { fullPage: true });
        }
        return;
      }
    } catch (error) {
      attempts++;
      log(
        `Error in handleRemainingSteps (attempt ${attempts}/${maxAttempts}):`,
        error.message
      );

      // Chụp màn hình khi có lỗi
      try {
        await takeScreenshot(page, user, {
          fullPage: true,
          createDateFolder: true,
          fileName: `error_${currentStep}_${Date.now()}.png`,
        });
      } catch (screenshotError) {
        log("Failed to take error screenshot:", screenshotError.message);
      }

      // Nghỉ ngắn sau khi gặp lỗi
      await randomTime(2, 5);
    }
  }

  // Nếu vòng lặp kết thúc mà không hoàn thành
  log("❌ Failed to complete all steps within the maximum attempts or timeout");
  await takeScreenshot(page, user, { fullPage: true });
}

module.exports = {
  taskRegisterGoethe,
};
