const { randomTime, userInputLoop } = require("../helper/func.js");
const { fightingForSlots } = require("./steps/fighting_slot.js");
const { stepChooseModule } = require("./steps/choose_module.js");
const { clickRegisterForMe } = require("./helper/click_register_for_me.js");
const { stepLogin } = require("./steps/login.js");
const { checkGoetheErrors } = require("./helper/goethe_err.js");
const { stepPayment } = require("./steps/payment.js");
const { stepInputData } = require("./steps/input_data.js");
const { cancellBooking,getActiveStepText } = require("./helper/click_cancel_booking");
const {acceptCookies} = require("./helper/click_cookies");
const { stepSummary } = require("./steps/summary.js");
const { takeScreenshot } = require("../helper/func.js");

async function taskRegisterGoethe(browser, page, url, user, pathProxy, exam) {
  try {
    console.log("Register Goethe");
    const newPage = await fightingForSlots(browser, page, url, pathProxy);
    if (newPage === null) {
      return null;
    }
    await randomTime(1, 2);
    console.log("Starting remaining steps");
    await handleRemainingSteps(newPage, user, exam, newPage.url());
    console.log("Done");
  } catch (error) {
    console.error("Error in taskRegisterGoethe:", error);
  }
}

async function handleRemainingSteps(page, user, exam, originUrl) {
  const maxAttempts = 20;
  const timeout = 6000000; // 10 minute all step
  const stepTimeout = 1200000; // 2 minute stuck in same step
  let attempts = 0;
  let startTime = Date.now();
  let lastStepTime = Date.now();
  let lastStep = "";
  let currentUrl = "";
  let currentStep = "";
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
  while (attempts < maxAttempts) {
    try {
      currentUrl = page.url();
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
      } else if (currentUrl.includes("coe/oska-acc")) {
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
        // currentStep = "unknown";
        currentStep = await getActiveStepText(page);
        console.log("222Unknown step:", currentUrl,currentStep  );
        await page.reload();
      }
      console.log("Current step:", currentStep);
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
      await acceptCookies(page)
      await cancellBooking(page);

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
          currentUrl = page.url();
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
        if (!page.url().includes("coe/selection")) {
          stepCompletionStatus.registerForMe = true;
          currentUrl = page.url();
          console.log(user.email, "✅ Completed: Register for me");
          await randomTime(1, 2);
        }
        // stepCompletionStatus.registerForMe = true;
        // console.log(user.email, "✅ Completed: Register for me");
        // await randomTime(1, 2);
      }
      // Login Step
      else if (currentStep.includes("login") && !stepCompletionStatus.login) {
        // attempts = 0;
        console.log(user.email, "🔑 Starting: Login", currentUrl);
        await stepLogin(page, user);
        await randomTime(3, 4);
        if (!page.url().includes("login")) {
          stepCompletionStatus.login = true;
          currentUrl = page.url();
          console.log(user.email, "✅ Completed: Login", currentUrl);
        }
      }
      // input data user
      else if (
        currentStep.includes("oska-acc") &&
        !stepCompletionStatus.personalInfo
      ) {
        // attempts = 0;
        console.log(user.email, "🔑 Starting: Personal Info", currentUrl);
        await stepInputData(page, user, exam);
        if (!page.url().includes("oska-acc")) {
          stepCompletionStatus.personalInfo = true;
          currentUrl = page.url();
          console.log(user.email, "✅ Completed: Personal Info");
        }
      }
      // child-acc step
      else if (
        currentStep.includes("child-acc") &&
        !stepCompletionStatus.childAcc
      ) {
        // attempts = 0;
        console.log(user.email, "🔑 Starting: Child Acc", currentUrl);
        // await stepInputData(page, user, exam);
        if (!page.url().includes("child-acc")) {
          stepCompletionStatus.childAcc = true;
          currentUrl = page.url();
          console.log(user.email, "✅ Completed: Child Acc");
        }
      }
      // studyGoethe Step
      else if (
        currentStep.includes("booked-options") &&
        !stepCompletionStatus.studyGoethe
      ) {
        attempts = 0;
        console.log(user.email, "🔑 Starting: Study Goethe", currentUrl);
        // await stepPayment(page);
        if (!page.url().includes("booked-options")) {
          stepCompletionStatus.studyGoethe = true;
          currentUrl = page.url();
          console.log(user.email, "✅ Completed: Study Goethe");
        }
      }
      // voucher Step
      else if (
        currentStep.includes("voucher") &&
        !stepCompletionStatus.voucher
      ) {
        // attempts = 0;
        console.log(user.email, "🔑 Starting: Voucher", currentUrl);
        await stepPayment(page);
        if (!page.url().includes("voucher")) {
          stepCompletionStatus.voucher = true;
          currentUrl = page.url();
          console.log(user.email, "✅ Completed: Voucher");
        }
      }
      // selection Step
      else if (
        currentStep.includes("psp_selection") &&
        !stepCompletionStatus.pspSelection
      ) {
        // attempts = 0;
        console.log(user.email, "🔑 Starting: PSP Selection", currentUrl);
        await stepPayment(page);
        if (!page.url().includes("psp-selection")) {
          stepCompletionStatus.pspSelection = true;
          currentUrl = page.url();
          console.log(user.email, "✅ Completed: PSP Selection");
        }
      }
      // summary Step
      else if (
        currentStep.includes("summary") &&
        !stepCompletionStatus.summary
      ) {
        // attempts = 0;
        console.log(user.email, "🔑 Starting: Summary", currentUrl);
        await stepSummary(page);
        if (!page.url().includes("summary")) {
          stepCompletionStatus.summary = true;
          currentUrl = page.url();
          console.log(user.email, "✅ Completed: Summary");
        }
      } else {
        attempts++;
        currentUrl = page.url();
        console.log("Unknown step:", currentUrl);
        await randomTime(3,4);
      }
    } catch (error) {
      attempts++;
      console.error("Error in handleRemainingSteps:", error);
    }
  }
}

module.exports = {
  taskRegisterGoethe,
};
