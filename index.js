const { connect } = require("puppeteer-real-browser");
const {
  randomTime,
  acceptCookies,
  clickButtonContinue,
  clickRegisterForMe,
  loginGoethe,
  userInputLoop,
  stepConfirmDone,
} = require("./helper.js");

const { readAccounts } = require("./readAccounts.js");

const startOnePage = async (email,password) => {
  const { browser, page } = await connect({
    headless: false,
    // args: [],
    // customConfig: {},
    // turnstile: true,
    // connectOption: {},
    // disableXvfb: false,
    // ignoreAllFlags: false,
    proxy: {
      host: "193.39.184.86",
      port: "61594",
      username: "tg9x0xdm",
      password: "dSdW4u9S",
    },
  });
  //193.39.184.86:61594:tg9x0xdm:dSdW4u9S
  console.log("Connected to browser");
  const url='https://www.goethe.de/coe?lang=vi&oid=3a16cc8727c1736380043caf334b0cd50599061081cbdd96afaeca4171f12aee';
  await page.goto(url);
  while(page.url().includes("error")){
    await randomTime(1, 2);
    await page.goto(url);
  }
  const MAX_ATTEMPTS = 50;
  let attemptCount = 0;
  let processCompleted = false;

  while (attemptCount < MAX_ATTEMPTS && !processCompleted) {
    attemptCount++;
    console.log(`Attempt ${attemptCount} of ${MAX_ATTEMPTS}`);

    try {
      currentUrl = page.url();
      console.log(`Processing URL: ${currentUrl}`);

      if (currentUrl.includes("coe/options")) {
        console.log("Handling options page");
        await randomTime(1,2);
        await acceptCookies(page, url);
        await clickButtonContinue(page);
      } else if (currentUrl.includes("coe/selection")) {
        console.log("Handling selection page");
        await randomTime(1,2);
        await clickRegisterForMe(page);
      } else if (currentUrl.includes("login.goethe.de")) {
        console.log("Handling login page");
        await randomTime(1,2);
        // const email = "oiu26227@bcooq.com";
        // const password = "Cuong@1998";
        await loginGoethe(page, email, password);
      } else if (currentUrl.includes("coe/oska-acc")) {
        console.log("Handling account page");
        await randomTime(5, 10);
        await clickButtonContinue(page);
      } else if (currentUrl.includes("coe/voucher")) {
        console.log("Handling voucher page");
        await randomTime(1, 2);
        await clickButtonContinue(page);
      } else if (currentUrl.includes("coe/psp-selection")) {
        console.log("Handling payment selection page");
        await randomTime(1, 2);
        await clickButtonContinue(page);
      } else if (currentUrl.includes("coe/summary")) {
        console.log("Handling summary page");
        await randomTime(1, 2);
        await stepConfirmDone(page);
        await userInputLoop();

        // Process successfully reached the end
        processCompleted = true;
        console.log("Process completed successfully!");
      } 
      else if(currentUrl.includes("error")){
        console.log("Handling error page");
        await randomTime(1, 2);
        await page.screenshot({ path: `img/${email}-error-attempt-${attemptCount}.png` });
        return;
      }
      else {
        console.log("Page not found or unrecognized URL");
        await page.reload();
        await randomTime(2, 3);
      }
    } catch (error) {
      console.error(`Error in attempt ${attemptCount}:`, error.message);
      await randomTime(3, 5);
    }
  }

  // Check if we reached the maximum attempts without completing
  if (attemptCount >= MAX_ATTEMPTS && !processCompleted) {
    console.log(
      `Maximum number of attempts (${MAX_ATTEMPTS}) reached without completing the process.`
    );
    console.log("Current URL:", page.url());
    // You could take a screenshot here to see what happened
    await page.screenshot({ path: `error-attempt-${attemptCount}.png` });
  } else if (processCompleted) {
    console.log(
      `Process completed successfully after ${attemptCount} attempts.`
    );
  }
};

async function processInBatches(items, fn, concurrency = 3) {
  const results = [];
  const totalItems = items.length;
  
  for (let i = 0; i < totalItems; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    console.log(`Processing batch ${Math.floor(i/concurrency) + 1}: ${batch.length} accounts`);
    
    const batchPromises = batch.map(item => {
      return fn(item).catch(error => {
        console.error(`Error processing item: ${JSON.stringify(item)}`, error);
        return { error, item };
      });
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }
  
  return results;
}

(async () => {
  try {
    const accounts = readAccounts("acc.txt");
    console.log(`Found ${accounts.length} accounts to process`);
    
    // Define how many browsers to run concurrently (adjust based on your system resources)
    const CONCURRENCY = 5;
    
    // Process accounts with the defined concurrency
    const processingFn = async (account) => {
      console.log(`Starting process for account: ${account.user}`);
      await startOnePage(account.user, account.pass);
      return { account, status: 'completed' };
    };
    
    const results = await processInBatches(accounts, processingFn, CONCURRENCY);
    
    // Log summary of results
    console.log("All accounts processed");
    
    const successful = results.filter(r => !r.error).length;
    console.log(`Successfully processed: ${successful}/${accounts.length} accounts`);
    const failed = results.filter(r => r.error);
    if (failed.length > 0) {
      console.log(`Failed accounts: ${failed.length}`);
      failed.forEach((result, index) => {
        console.log(`  ${index + 1}. ${result.item.user}: ${result.error.message}`);
      });
    }
  } catch (error) {
    console.error("Fatal error in main process:", error);
  }
})();