const { randomTime, userInputLoop } = require("../helper/func.js");
const { fightingForSlots } = require("./steps/fighting_slot.js");
const { stepChooseModule } = require("./steps/choose_module.js");
const { clickRegisterForMe } = require("./helper/click_register_for_me.js");
const { stepLogin } = require("./steps/login.js");
const { checkGoetheErrors } = require("./helper/goethe_err.js");

async function taskRegisterGoethe(browser, page, url, user, pathProxy, exam) {
  try {
    console.log("Register Goethe");
    const newPage = await fightingForSlots(browser, page, url, pathProxy);
    if (newPage === null) {
      return null;
    }
    await randomTime(1, 2);
    console.log("Starting remaining steps",newPage.url());
    await handleRemainingSteps(newPage, user, exam, newPage.url());
    console.log("Done");
  } catch (error) {
    console.error("Error in taskRegisterGoethe:", error);
  }
}

async function handleRemainingSteps(page, user, exam, originUrl) {
  const maxAttempts = 5;
  const timeout = 6000000; // 10 minute all step
  const stepTimeout = 1200000; // 2 minute stuck in same step
  let attempts = 0;
  let startTime = Date.now();
  let lastStepTime = Date.now();
  let lastStep = "";
  let stepCompletionStatus = {
    chooseModule: false,
    login: false,
    registerForMe: false,
    studyGoethe: false,
    personalInfo: false,
    voucher: false,
    pspSelection: false,
    summary: false,
  };
  while (attempts < maxAttempts && Date.now() - startTime < timeout) {
    try {
      let currentStep = "";
      const currentUrl = page.url();
      if (await checkGoetheErrors(page, user)) {
        return;
      }
      // Check current step
      if (currentUrl.includes("coe/options")) {
        currentStep = "choose_module";
      } else if (currentUrl.includes("coe/selection")) {
        currentStep = "button_register_for_me";
      } else if (currentUrl.includes("login.goethe.de")) {
        currentStep = "login";
      } else if (currentUrl.includes("oska-acc")) {
        currentStep = "personal_info";
      } else if (currentUrl.includes("child-acc")) {
        currentStep = "child_acc";
      } else if (currentUrl.includes("booked-options")) {
        currentStep = "study-goethe";
      } else if (currentUrl.includes("voucher")) {
        currentStep = "voucher";
      } else if (currentUrl.includes("psp-selection")) {
        currentStep = "psp_selection";
      } else if (currentUrl.includes("summary")) {
        currentStep = "summary";
      } else {
        currentStep = "unknown";
        console.log("Unknown step:", currentUrl);
        return;
      }
      // Check if stuck in same step for too long
      if (currentStep === lastStep && Date.now() - lastStepTime > stepTimeout) {
        console.log(`Stuck in ${currentStep} for too long, refreshing...`);
        await page.reload();
        // await accpectCookiesV2(page);
        lastStepTime = Date.now();
        attempts++;
        continue;
      }
      // Update step tracking
      if (currentStep !== lastStep) {
        lastStep = currentStep;
        lastStepTime = Date.now();
      }

      // Choose Module Step
      if (
        currentStep.includes("choose_module") &&
        !stepCompletionStatus.chooseModule
      ) {
        attempts = 0;
        console.log(user.email, "📚 Starting: Choose module", currentUrl);
        await stepChooseModule(page, user);
        if (!page.url().includes("options")) {
          stepCompletionStatus.chooseModule = true;
          console.log(user.email, "✅ Completed: Choose module");
        }
      }
      // Register For Me Step
      else if (
        currentStep.includes("button_register_for_me") &&
        !stepCompletionStatus.registerForMe
      ) {
        attempts = 0;
        console.log(user.email, "📝 Starting: Register for me", currentUrl);
        await clickRegisterForMe(page);
        stepCompletionStatus.registerForMe = true;
        console.log(user.email, "✅ Completed: Register for me");
      }
      // // Login Step
      // else if (currentStep.includes("login") && !stepCompletionStatus.login) {
      //   attempts = 0;
      //   console.log(user.email, "🔑 Starting: Login", currentUrl);
      //   await stepLogin(page, user);
      //   stepCompletionStatus.login = true;
      //   console.log(user.email, "✅ Completed: Login");
      //   // await page.pause();
      // }
      else{
        console.log("Unknown step:", currentUrl);
        await userInputLoop();
      }
    } catch (error) {
      console.error("Error in handleRemainingSteps:", error);
    }
  }
}

module.exports = {
  taskRegisterGoethe,
};
