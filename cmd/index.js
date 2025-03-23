const { getProxies } = require("./helper/proxy.js");
const { connectRedis, subscribeToRegistrationLinks } = require("./utils/redis.js");
const { 
  initQueue,
  addToQueue, 
  processQueue,
  getQueueLength,
  getActiveBrowserCount
} = require("./utils/registrationQueue.js");
const { closeAllBrowsers } = require("./utils/registrationUtils.js");

// Main function with Redis integration
(async () => {
  console.log("Starting Goethe Registration System with Redis Integration and Queue System");
  
  // Connect to Redis first
  await connectRedis();
  
  // Load proxies
  const pathProxy = "./cmd/data/proxy/proxy.txt";
  const listProxies = getProxies(pathProxy);
  if (!listProxies || listProxies.length === 0) {
    console.warn(`Không có proxy nào cho exam`);
    return;
  }  
  // Initialize the queue system with proxies
  initQueue(listProxies);
  console.log(`Queue system initialized with max 5 concurrent browsers and ${listProxies.length} proxies`);
  
  // Subscribe to Redis channel for registration links
  const redisChannel = process.env.REDIS_REGISTER_CHANNEL || 'url_updates';
  console.log(`Subscribing to Redis channel: ${redisChannel}`);
  
  // Set up periodic status reporting
  setInterval(() => {
    console.log(`Queue status: ${getQueueLength()} links waiting, ${getActiveBrowserCount()} active browsers`);
  }, 60000); // Log status every minute
  
  await subscribeToRegistrationLinks(redisChannel, (link, examCode, modules, date) => {
    // Reconstruct message and add it to the queue
    const message = `${link}@${examCode}@${modules}@${date}`;
    addToQueue(message);
    // Queue system will automatically process links as browser capacity becomes available
  });
  
  console.log("Waiting for registration links from Redis...");
  
  // Optional: Process an initial URL to test
  const initialUrl = process.env.INITIAL_REGISTER_URL;
  const initialExam = process.env.INITIAL_EXAM || "hcm_b2-link1";
  const initialModules = process.env.INITIAL_MODULES || "Reading-Listening-Writing-Speaking";
  const initialDate = process.env.INITIAL_DATE || new Date().toLocaleDateString('en-GB');
  
  if (initialUrl) {
    console.log(`Adding initial URL to queue: ${initialUrl}`);
    const initialMessage = `${initialUrl}@${initialExam}@${initialModules}@${initialDate}`;
    addToQueue(initialMessage);
  }
  
  // Keep the process running
  process.on('SIGINT', async () => {
    console.log('Received SIGINT. Gracefully shutting down...');
    
    // Close all active browsers
    await closeAllBrowsers();
    
    process.exit(0);
  });
})();
