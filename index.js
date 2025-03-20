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

const start = async () => {
  // const { page, browser } = await connect();
  const { browser, page } = await connect({
    headless: false,
    // args: [],
    // customConfig: {},
    // turnstile: true,
    // connectOption: {},
    // disableXvfb: false,
    // ignoreAllFlags: false,
    // proxy: {
    //   host: "103.161.97.57",
    //   port: "20667",
    //   username: "a6jnq82n",
    //   password: "ldU1liiI0vgL",
    // },
  });
  //103.161.97.57:20667:a6jnq82n:ldU1liiI0vgL
  // 103.176.251.123:51544:qb979tl3:l8JDgMUYfL2O
  //   const page = await browser.newPage({
  //     setBypassCSP: true,
  //  });

  //  await page.addInitScript(`
  //     const newProto = navigator.__proto__;
  //     delete newProto.webdriver;
  //     navigator.__proto__ = newProto;

  //     window.console.debug = () => {
  //       return null;
  //     };

  //     // We can mock this in as much depth as we need for the test.
  //     window.chrome = {
  //       runtime: {},
  //     };

  //     if (!window.Notification) {
  //       window.Notification = {
  //         permission: "denied",
  //       };
  //     }

  //     // Pass the Permissions Test.
  //     const originalQuery = window.navigator.permissions.query;
  //     window.navigator.permissions.__proto__.query = parameters =>
  //       parameters.name === "notifications"
  //         ? Promise.resolve({
  //             state: Notification.permission,
  //           })
  //         : originalQuery(parameters);

  //     // Inspired by: https://github.com/ikarienator/phantomjs_hide_and_seek/blob/master/5.spoofFunctionBind.js
  //     const oldCall = Function.prototype.call;

  //     function call() {
  //       return oldCall.apply(this, arguments);
  //     }
  //     Function.prototype.call = call;

  //     const nativeToStringFunctionString = Error.toString().replace(/Error/g, "toString");
  //     const oldToString = Function.prototype.toString;

  //     function functionToString() {
  //       if (this === window.navigator.permissions.query) {
  //         return "function query() { [native code] }";
  //       }
  //       if (this === functionToString) {
  //         return nativeToStringFunctionString;
  //       }
  //       return oldCall.call(oldToString, this);
  //     }
  //     Function.prototype.toString = functionToString;

  //     // Overwrite the "plugins" property to use a custom getter.
  //     Object.defineProperty(navigator, "plugins", {
  //       get: () => {
  //         const ChromiumPDFPlugin = {};
  //         ChromiumPDFPlugin.__proto__ = Plugin.prototype;
  //         const plugins = {
  //           0: ChromiumPDFPlugin,
  //           description: "Portable Document Format",
  //           filename: "internal-pdf-viewer",
  //           length: 1,
  //           name: "Chromium PDF Plugin",
  //           _proto_: PluginArray.prototype,
  //         };
  //         return plugins;
  //       },
  //     });

  //     const elementDescriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight");

  //     // redefine the property with a patched descriptor
  //     Object.defineProperty(HTMLDivElement.prototype, "offsetHeight", {
  //       ...elementDescriptor,
  //       get: function () {
  //         if (this.id === "modernizr") {
  //           return 1;
  //         }
  //         // @ts-ignore
  //         return elementDescriptor.get.apply(this);
  //       },
  //     });

  //     // Overwrite the languages property to use a custom getter.
  //     Object.defineProperty(navigator, "languages", {
  //       get: () => ["en-US", "en"],
  //     });

  //     Object.defineProperty(HTMLIFrameElement.prototype, "contentWindow", {
  //       get: function () {
  //         return window;
  //       },
  //     });`);

  // await page.evaluateOnNewDocument(() => {
  //   const newProto = navigator.__proto__;
  //   delete newProto.webdriver;
  //   navigator.__proto__ = newProto;

  //   window.console.debug = () => {
  //     return null;
  //   };

  //   // We can mock this in as much depth as we need for the test.
  //   window.chrome = {
  //     runtime: {},
  //   };

  //   if (!window.Notification) {
  //     window.Notification = {
  //       permission: "denied",
  //     };
  //   }

  //   // Pass the Permissions Test.
  //   const originalQuery = window.navigator.permissions.query;
  //   window.navigator.permissions.__proto__.query = (parameters) =>
  //     parameters.name === "notifications"
  //       ? Promise.resolve({
  //           state: Notification.permission,
  //         })
  //       : originalQuery(parameters);

  //   // Inspired by: https://github.com/ikarienator/phantomjs_hide_and_seek/blob/master/5.spoofFunctionBind.js
  //   const oldCall = Function.prototype.call;

  //   function call() {
  //     return oldCall.apply(this, arguments);
  //   }
  //   Function.prototype.call = call;

  //   const nativeToStringFunctionString = Error.toString().replace(
  //     /Error/g,
  //     "toString"
  //   );
  //   const oldToString = Function.prototype.toString;

  //   function functionToString() {
  //     if (this === window.navigator.permissions.query) {
  //       return "function query() { [native code] }";
  //     }
  //     if (this === functionToString) {
  //       return nativeToStringFunctionString;
  //     }
  //     return oldCall.call(oldToString, this);
  //   }
  //   Function.prototype.toString = functionToString;

  //   // Overwrite the "plugins" property to use a custom getter.
  //   Object.defineProperty(navigator, "plugins", {
  //     get: () => {
  //       const ChromiumPDFPlugin = {};
  //       ChromiumPDFPlugin.__proto__ = Plugin.prototype;
  //       const plugins = {
  //         0: ChromiumPDFPlugin,
  //         description: "Portable Document Format",
  //         filename: "internal-pdf-viewer",
  //         length: 1,
  //         name: "Chromium PDF Plugin",
  //         __proto__: PluginArray.prototype,
  //       };
  //       return plugins;
  //     },
  //   });

  //   const elementDescriptor = Object.getOwnPropertyDescriptor(
  //     HTMLElement.prototype,
  //     "offsetHeight"
  //   );

  //   // Redefine the property with a patched descriptor
  //   Object.defineProperty(HTMLDivElement.prototype, "offsetHeight", {
  //     ...elementDescriptor,
  //     get: function () {
  //       if (this.id === "modernizr") {
  //         return 1;
  //       }
  //       return elementDescriptor.get.apply(this);
  //     },
  //   });

  //   // Overwrite the languages property to use a custom getter.
  //   Object.defineProperty(navigator, "languages", {
  //     get: () => ["en-US", "en"],
  //   });

  //   Object.defineProperty(HTMLIFrameElement.prototype, "contentWindow", {
  //     get: function () {
  //       return window;
  //     },
  //   });
  // });
  console.log("Connected to browser");
  // const url = "https://www.goethe.de/coe/entry?lang=vi&oid=7bab66549b967fd45a96a1575cfd97c4fa31baf5e3c4fb2f6f2a098db02231bf";
  const url =
    "https://www.goethe.de/coe?lang=vi&oid=d155f6758546edfb6c0627ebdc1a00d3b7633e1e82e4035aa2e9f377dd0d5671";
  await page.goto(url);
  //https://www.goethe.de/coe/options?1
  //https://www.goethe.de/coe/selection?2
  //https://login.goethe.de/cas/login?service=https://www.goethe.de/coe/cas%3Fcoeintid%3Da676c81b-e500-49b6-aac4-ac424cb56de9&renew=true&locale=vi
  //https://www.goethe.de/coe/oska-acc?12
  //https://www.goethe.de/coe/voucher?7
  //https://www.goethe.de/coe/psp-selection?8
  //https://www.goethe.de/coe/summary?9
  // let currentUrl = page.url();
  // console.log(`Current URL: ${currentUrl}`);
  // while (true) {
  //   currentUrl = page.url();
  //   console.log(`Processing URL: ${currentUrl}`);
  //   if (currentUrl.includes("coe/options")) {
  //     await randomTime(3, 4);
  //     await acceptCookies(page, url);
  //     await clickButtonContinue(page);
  //   } else if (currentUrl.includes("coe/selection")) {
  //     await randomTime(3, 4);
  //     await clickRegisterForMe(page);
  //   } else if (currentUrl.includes("login.goethe.de")) {
  //     await randomTime(3, 4);
  //     const email = "cab68527@msssg.com";
  //     const password = "Cuong@1998";
  //     await loginGoethe(page, email, password);
  //   }
  //   else if(currentUrl.includes("coe/oska-acc")){
  //     await randomTime(5,10);
  //     await clickButtonContinue(page);
  //   }
  //   else if(currentUrl.includes("coe/voucher")){
  //     await randomTime(1, 2);
  //     await clickButtonContinue(page);
  //   }
  //   else if(currentUrl.includes("coe/psp-selection")){
  //     await randomTime(1, 2);
  //     await clickButtonContinue(page);
  //   }
  //   else if(currentUrl.includes("coe/summary")){
  //     await randomTime(1, 2);
  //     await userInputLoop();
  //   }
  //   else{
  //     console.log("Page not found");
  //     await page.reload();
  //   }
  // }

  // Maximum number of iterations for the loop
  const MAX_ATTEMPTS = 50;
  let attemptCount = 0;

  // Track whether we've successfully completed the process
  let processCompleted = false;

  while (attemptCount < MAX_ATTEMPTS && !processCompleted) {
    attemptCount++;
    console.log(`Attempt ${attemptCount} of ${MAX_ATTEMPTS}`);

    try {
      currentUrl = page.url();
      console.log(`Processing URL: ${currentUrl}`);

      if (currentUrl.includes("coe/options")) {
        console.log("Handling options page");
        await randomTime(3, 4);
        await acceptCookies(page, url);
        await clickButtonContinue(page);
      } else if (currentUrl.includes("coe/selection")) {
        console.log("Handling selection page");
        await randomTime(3, 4);
        await clickRegisterForMe(page);
      } else if (currentUrl.includes("login.goethe.de")) {
        console.log("Handling login page");
        await randomTime(3, 4);
        const email = "tll79591@bcooq.com";
        const password = "Cuong@1998";
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
      } else {
        console.log("Page not found or unrecognized URL");
        await page.reload();
        await randomTime(2, 3);
      }

      // Wait for navigation (if it happens)
      // try {
      //   await page.waitForNavigation({ timeout: 10000 }).catch(() => {
      //     console.log("No navigation occurred or timeout reached");
      //   });
      // } catch (error) {
      //   console.log("Navigation error:", error.message);
      // }
    } catch (error) {
      console.error(`Error in attempt ${attemptCount}:`, error.message);
      // Wait before retrying
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

  // await randomTime(3, 4);
  // await acceptCookies(page, url);
  // await randomTime(3, 4);

  // await clickButtonContinue(page);
  // await randomTime(3, 4);

  // await clickRegisterForMe(page);
  // await randomTime(3, 4);

  // const email = "cab68527@msssg.com";
  // const password = "Cuong@1998";
  // await loginGoethe(page, email, password);
  // await randomTime(3, 4);

  // await clickButtonContinue(page);
  // await randomTime(3, 4);

  // await clickButtonContinue(page);
  // await randomTime(3, 4);

  // await userInputLoop();
  // console.log("Page loaded");
};

start();
