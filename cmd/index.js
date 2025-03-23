const { getProxies } = require("./helper/proxy.js");
const { connectRedis, subscribeToRegistrationLinks } = require("./utils/redis.js");
const { processRegistrationLink, closeAllBrowsers } = require("./utils/registrationUtils.js");

// Main function with Redis integration
(async () => {
  console.log("Starting Goethe Registration System with Redis Integration");
  
  // Connect to Redis first
  await connectRedis();
  
  // Load proxies
  const pathProxy = "./cmd/data/proxy/proxy.txt";
  const listProxies = getProxies(pathProxy);
  if (!listProxies || listProxies.length === 0) {
    console.warn(`Không có proxy nào cho exam`);
    return;
  }
  
  // Subscribe to Redis channel for registration links
  const redisChannel = process.env.REDIS_REGISTER_CHANNEL || 'goethe-register-links';
  console.log(`Subscribing to Redis channel: ${redisChannel}`);
  
  await subscribeToRegistrationLinks(redisChannel, (link, examCode, modules, date) => {
    // Reconstruct message and process it
    const message = `${link}@${examCode}@${modules}@${date}`;
    processRegistrationLink(message, listProxies);
  });
  
  console.log("Waiting for registration links from Redis...");
  
  // Optional: Process an initial URL to test
  const initialUrl = process.env.INITIAL_REGISTER_URL;
  const initialExam = process.env.INITIAL_EXAM || "hcm_b2-link1";
  const initialModules = process.env.INITIAL_MODULES || "Reading-Listening-Writing-Speaking";
  const initialDate = process.env.INITIAL_DATE || new Date().toLocaleDateString('en-GB');
  
  if (initialUrl) {
    console.log(`Processing initial URL: ${initialUrl}`);
    processRegistrationLink(`${initialUrl}@${initialExam}@${initialModules}@${initialDate}`, listProxies);
  }
  
  // Keep the process running
  process.on('SIGINT', async () => {
    console.log('Received SIGINT. Gracefully shutting down...');
    
    // Close all active browsers
    await closeAllBrowsers();
    
    process.exit(0);
  });
})();
