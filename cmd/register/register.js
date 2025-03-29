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
const { waitForLoadingComplete } = require("./helper/wait_for_loading.js");

async function taskRegisterGoethe(
  browser,
  page,
  url,
  user,
  pathProxy,
  exam,
  browserId,
  endStep = 'success'
) {
  try {
    const identifier = browserId || `user-${user.email.split("@")[0]}`;
    console.log(
      `Browser ${identifier}: Starting registration process for ${user.email}`
    );
    url='https://www.goethe.de/coe?lang=vi&oid=d155f6758546edfb6c0627ebdc1a00d3b7633e1e82e4035aa2e9f377dd0d5671'

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

    console.log(
      `Browser ${identifier}: Starting remaining steps for ${user.email}`
    );
    console.log("user đang chạy", user.email);
    // Pass endStep to handleRemainingSteps
    await handleRemainingSteps(newPage, user, exam, newPage.url(), identifier, endStep);

    console.log(`Browser ${identifier}: Process completed for ${user.email}`);
  } catch (error) {
    console.error(
      `Error in browser ${browserId} for ${user.email}: ${error.message || "Unknown error"
      }`
    );
  }
}

async function handleRemainingSteps(
  page,
  user,
  exam,
  originUrl,
  identifier = "",
  endStep = 'success'
) {
  const maxAttempts = 20;
  const maxStepAttempts = 5; // Maximum attempts per individual step
  const timeout = 6000000; // 10 minute all step
  const stepTimeout = 1200000; // 2 minute stuck in same step
  let attempts = 0;
  let startTime = Date.now();
  let lastStepTime = Date.now();
  let lastStep = "";
  let currentStep = "";
  let cuongCheck=0;

  // Validate endStep
  if (endStep !== 'summary' && endStep !== 'success') {
    console.error(`Invalid endStep: ${endStep}. Must be either 'summary' or 'success'`);
    endStep = 'success'; // Default to success if invalid
  }

  // Track attempts per step
  let stepAttempts = {};

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

  // Initialize step attempts counter
  Object.keys(stepCompletionStatus).forEach(step => {
    stepAttempts[step] = 0;
  });

  // Định nghĩa các xử lý cho từng bước
  const stepHandlers = {
    choose_module: async () => {
      log("📚 Starting: Choose module");
      try {
        await stepChooseModule(page, user);
        return checkStepCompletion(
          page,
          user,
          "choose_module",
          stepCompletionStatus,
          "options",
          identifier
        );
      } catch (error) {
        log(`❌ Error in choose_module step: ${error.message}`);
        return false;
      }
    },

    button_register_for_me: async () => {
      log("📝 Starting: Register for me");
      try {
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
      } catch (error) {
        // Nếu có lỗi liên quan đến bước này, ghi log và đảm bảo trả về false
        log(`❌ Error in button_register_for_me step: ${error.message}`);
        return false;
      }
    },

    login: async () => {
      log("🔑 Starting: Login");
      try {
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
      } catch (error) {
        log(`❌ Error in login step: ${error.message}`);
        return false;
      }
    },

    personal_info: async () => {
      log("👤 Starting: Personal Info");
      try {
        await stepInputData(page, user, exam);
        return checkStepCompletion(
          page,
          user,
          "personal_info",
          stepCompletionStatus,
          "oska-acc",
          identifier
        );
      } catch (error) {
        log(`❌ Error in personal_info step: ${error.message}`);
        return false;
      }
    },

    child_acc: async () => {
      log("👶 Starting: Child Account");
      try {
        // await stepInputData(page, user, exam);
        return checkStepCompletion(
          page,
          user,
          "child_acc",
          stepCompletionStatus,
          "child-acc",
          identifier
        );
      } catch (error) {
        log(`❌ Error in child_acc step: ${error.message}`);
        return false;
      }
    },

    study_goethe: async () => {
      log("📖 Starting: Study Goethe");
      try {
        // await stepPayment(page);
        return checkStepCompletion(
          page,
          user,
          "study_goethe",
          stepCompletionStatus,
          "booked-options",
          identifier
        );
      } catch (error) {
        log(`❌ Error in study_goethe step: ${error.message}`);
        return false;
      }
    },

    voucher: async () => {
      log("🎫 Starting: Voucher");
      try {
        await stepPayment(page);
        return checkStepCompletion(
          page,
          user,
          "voucher",
          stepCompletionStatus,
          "voucher",
          identifier
        );
      } catch (error) {
        log(`❌ Error in voucher step: ${error.message}`);
        return false;
      }
    },

    psp_selection: async () => {
      log("💳 Starting: PSP Selection");
      try {
        await stepPayment(page);
        return checkStepCompletion(
          page,
          user,
          "psp_selection",
          stepCompletionStatus,
          "psp-selection",
          identifier
        );
      } catch (error) {
        log(`❌ Error in psp_selection step: ${error.message}`);
        return false;
      }
    },
    summary: async () => {
      log("📋 Starting: Summary");
      try {
        const success = await stepSummary(page, user, endStep);
        if (success) {
          stepCompletionStatus.summary = true;
          log("✅ Summary step completed successfully!");
          
          // If endStep is 'summary', we're done here
          if (endStep === 'summary') {
            log("🎉 Ending at summary step as requested");
            return true;
          }
        }
        return success;
      } catch (error) {
        log(`❌ Error in summary step: ${error.message}`);
        return false;
      }
    },
    success: async () => {
      log("🎉 Starting: Success page");
      try {
        const result = await stepSuccess(page, user, log);
        if (result) {
          stepCompletionStatus.success = true;
          log("✅ Success step completed!");
          // If endStep is 'success', we're done here
          if (endStep === 'success') {
            log("🎉 Ending at success step as requested");
            return true;
          }
        }
        return result;
      } catch (error) {
        log(`❌ Error in success step: ${error.message}`);
        return false;
      }
    },
  };

  while (attempts < maxAttempts && Date.now() - startTime < timeout) {
    try {
      cuongCheck++
      if(cuongCheck>10){
        log("🔍 Quá giới hạn ");
        return;
      }
      // Đợi cho trang loading biến mất
      await waitForLoadingComplete(page, {
        logEnabled: false,
        timeout: 15000
      });

      // Kiểm tra lỗi Goethe
      const goetheError = await checkGoetheErrors(page, user);
      if (goetheError) {
        // Nếu có lỗi, hiển thị thông tin chi tiết
        log(`⚠️ Goethe error detected: ${goetheError.message || 'Unknown error'}`);
        
        await takeScreenshot(page, user, {
          fullPage: true,
          showUrl: true,
          urlBarPosition: "top",
          fileName: `goethe_error_${Date.now()}.png`,
          createDateFolder: true,
        });
        
        log("⚠️ Breaking out of registration flow due to Goethe error.");
        return; // Thoát khỏi quá trình đăng ký
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

      log(`Current step: ${currentStep}`);

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

        // Increment step-specific attempts
        if (currentStep && stepAttempts[currentStep] !== undefined) {
          stepAttempts[currentStep]++;
        }

        continue;
      }

      // Cập nhật theo dõi bước
      if (currentStep !== lastStep) {
        lastStep = currentStep;
        lastStepTime = Date.now();
        
        // Đợi cho trang loading biến mất khi chuyển bước
        await waitForLoadingComplete(page, {
          logEnabled: false,
          timeout: 10000
        });
      }

      // // Xử lý các hành động chung cho tất cả các bước
      await acceptCookies(page);
      await cancellBooking(page);

      // Xử lý bước hiện tại nếu chưa hoàn thành và chưa vượt quá số lần thử
      const handler = stepHandlers[currentStep];
      if (handler && !stepCompletionStatus[currentStep]) {
        // Check if maximum attempts for this step have been reached
        if (stepAttempts[currentStep] >= maxStepAttempts) {
          log(`⚠️ Maximum attempts (${maxStepAttempts}) reached for step "${currentStep}". Skipping...`);
          // Take screenshot of the failed step
          await takeScreenshot(page, user, {
            fullPage: true,
            createDateFolder: true,
            fileName: `max_attempts_${currentStep}.png`,
          });

          // Force move to next step (mark current as completed)
          stepCompletionStatus[currentStep] = true;
          
          // Kiểm tra xem có phải bước quan trọng không để quyết định có thoát luôn hay không
          if (["button_register_for_me", "login", "personal_info"].includes(currentStep)) {
            log(`⚠️ Critical step "${currentStep}" failed after ${maxStepAttempts} attempts. Breaking out of registration flow.`);
            return; // Thoát khỏi quy trình đăng ký
          }
        } else {
          // Try to handle the step
          const success = await handler();

          // If we've completed the endStep, exit the loop
          if (success && currentStep === endStep) {
            log(`✅ Process completed successfully at ${endStep} step!`);
            await takeScreenshot(page, user, { fullPage: true });
            return;
          }

          // Increment attempt counter only if the step failed
          if (!success) {
            stepAttempts[currentStep]++;
            log(`Step "${currentStep}" attempt ${stepAttempts[currentStep]}/${maxStepAttempts}`);
            
            // Nếu bước hiện tại là một bước quan trọng và đã thử gần đủ số lần tối đa, thoát sớm
            if (["button_register_for_me", "login", "personal_info","summary"].includes(currentStep) && 
                stepAttempts[currentStep] >= maxStepAttempts - 1) {
              log(`⚠️ Critical step "${currentStep}" close to max attempts. Breaking out after ${stepAttempts[currentStep]} attempts.`);
              await takeScreenshot(page, user, {
                fullPage: true,
                createDateFolder: true,
                fileName: `critical_exit_${currentStep}.png`,
              });
              return; // Thoát sớm
            }
          }
        }
      } else if (!handler) {
        // Bước không xác định
        log("Unknown or unhandled step:");
        attempts++;
        await randomTime(3, 4);
      }
    } catch (error) {
      attempts++;

      // Increment step-specific attempts when an error occurs
      if (currentStep && stepAttempts[currentStep] !== undefined) {
        stepAttempts[currentStep]++;
        log(`Error in step "${currentStep}" (attempt ${stepAttempts[currentStep]}/${maxStepAttempts}): ${error.message}`);

        // If max attempts reached for this step, mark it as completed to move on
        if (stepAttempts[currentStep] >= maxStepAttempts) {
          log(`⚠️ Maximum attempts (${maxStepAttempts}) reached for step "${currentStep}" after error. Moving on...`);
          stepCompletionStatus[currentStep] = true;
        }
      } else {
        log(`Error in handleRemainingSteps (attempt ${attempts}/${maxAttempts}): ${error.message}`);
      }
      // Chụp màn hình khi có lỗi
      try {
        await takeScreenshot(page, user, {
          fullPage: true,
          createDateFolder: true,
          fileName: `error_${currentStep}_${Date.now()}.png`,
        });
        
        // Check if the screenshot was related to a critical error (like in your logs where it got stuck)
        // If we've reached maxStepAttempts or close to it for the current step, break out
        if (stepAttempts[currentStep] >= maxStepAttempts - 1) {
          log(`⚠️ Critical error detected after ${stepAttempts[currentStep]} attempts at "${currentStep}". Screenshot taken and breaking out of registration flow.`);
          return; // Exit the function entirely to stop processing
        }
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

// Hàm xác định bước hiện tại dựa trên URL
async function getCurrentStep(page, identifier = "") {
  const currentUrl = page.url();
  console.log(`Browser for ${identifier}: Checking current URL: ${currentUrl}`);

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

  // Tìm bước dựa trên URL (case-insensitive)
  for (const { pattern, step } of urlStepMap) {
    if (currentUrl.toLowerCase().includes(pattern.toLowerCase())) {
      console.log(`Browser for ${identifier}: Matched step "${step}" from pattern "${pattern}"`);
      return step;
    }
  }

  // Nếu không tìm thấy, thử phương thức khác để xác định bước
  try {
    // Check page title which might contain step information
    const pageTitle = await page.title();
    console.log(`Browser for ${identifier}: Page title: "${pageTitle}"`);
    
    // For debugging - take screenshot when step detection fails
    await takeScreenshot(page, { 
      fullPage: true, 
      createDateFolder: true,
      fileName: `unknown_step_${Date.now()}.png` 
    });
    
    // Try to get text from any step indicator elements
    const activeStep = await getActiveStepText(page);
    console.log(
      `Browser for ${identifier}: Step detection failed. URL: ${currentUrl}, Active step text: "${activeStep}"`
    );
    
    // Additional attempts to identify the page - check for specific elements
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log(`Browser for ${identifier}: First 100 chars of page body: "${bodyText.substring(0, 100)}..."`);
    
    // Try to identify based on DOM structure or specific elements
    const hasLoginForm = await page.evaluate(() => !!document.querySelector('form input[type="password"]'));
    if (hasLoginForm) {
      console.log(`Browser for ${identifier}: Detected login form on page`);
      return "login";
    }
    
    if (activeStep) {
      return activeStep;
    }
    
    return "unknown";
  } catch (error) {
    console.error(`Browser for ${identifier}: Error in getCurrentStep: ${error.message}`);
    return "unknown";
  }
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

module.exports = {
  taskRegisterGoethe,
};
