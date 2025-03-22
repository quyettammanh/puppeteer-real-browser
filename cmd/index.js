const { initBrowserWithRealBrowser } = require("./puppeteer/multi_browser.js");
const { createUsers } = require("./utils/user.js");
const { taskRegisterGoethe } = require("./register/register.js");
const { getProxies } = require("./helper/proxy.js");
const { userInputLoop } = require("./helper/func.js");

(async () => {
  console.log("Register Goethe");
  const pathProxy = "./cmd/data/proxy/proxy.txt";
  const listProxies = getProxies(pathProxy);
  if (!listProxies || listProxies.length === 0) {
    console.warn(`Không có proxy nào cho exam`);
    return;
  }
  
  // Load users
  const userByPath = "./cmd/data/user/1.json";
  const listUsers = await createUsers(userByPath);
  if (!listUsers || listUsers.length === 0) {
    console.warn(`Không có user nào cho exam`);
    return;
  }
  
  const exam = "b1_hcm";
  const url = "https://www.goethe.de/coe?lang=vi&oid=3a16cc8727c1736380043caf334b0cd50599061081cbdd96afaeca4171f12aee";
  
  // Process users in parallel with separate browser instances
  const taskPromises = [];
  const numUsers = 5; // Number of browsers to open
  
  for (let i = 0; i < numUsers; i++) {
    // Select a user - use the index if available, otherwise use the first user
    const user = listUsers.length > i ? listUsers[i] : listUsers[0];
    
    // Select a random proxy
    const proxy = listProxies[Math.floor(Math.random() * listProxies.length)];
    
    // Generate a unique browser ID for this instance
    const browserId = `browser-${i+1}-${Math.random().toString(36).substring(2, 6)}`;
    
    console.log(`User ${i+1}: Starting ${user.email} with browser ID ${browserId}`);
    
    // Start a new browser for each user
    const browserPromise = (async () => {
      try {
        // Initialize a new browser for this user with the browser ID
        // const { browser, page } = await initBrowserWithRealBrowser(browserId,proxy);
        const { browser, page } = await initBrowserWithRealBrowser(browserId);

        // Process with this browser
        await taskRegisterGoethe(browser, page, url, user, pathProxy, exam, browserId);
        
        // Close the browser when done
        console.log(`Browser ${browserId}: ${user.email} completed, closing browser`);
        await browser.close();
      } catch (error) {
        console.error(`Error for ${browserId} (${user.email}):`, error);
      }
    })();
    
    taskPromises.push(browserPromise);
  }
  
  // Wait for all tasks to complete
  await Promise.all(taskPromises);
  
  console.log("All users completed");
})();
