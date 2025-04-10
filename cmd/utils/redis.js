// redis.js
const redis = require("redis");
const { promisify } = require("util");
const dotenv = require("dotenv");

// Nạp biến môi trường từ file .env
dotenv.config();

// Cấu hình kết nối Redis
const redisClient = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST || "localhost",
    port: process.env.REDIS_PORT || 6379,
    connectTimeout: 10000, // Tăng thời gian timeout lên 10 giây
  },
  password: process.env.REDIS_PASSWORD || undefined,
});

const redisSub = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT || 6379,
    connectTimeout: 10000, // Tăng thời gian timeout lên 10 giây
  },
  password: process.env.REDIS_PASSWORD || undefined,
});

const connectLinkQueue =
  "redis://" + process.env.REDIS_HOST + ":" + process.env.REDIS_PORT;

const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.error("Không thể kết nối Redis:", err.message);
    setTimeout(() => connectRedis(client), 5000);
  }
};

const connectRedisSub = async () => {
  try {
    await redisSub.connect();
    return redisSub;
  } catch (err) {
    console.error("Không thể kết nối Redis:", err.message);
    setTimeout(() => connectRedis(client), 5000);
  }
};

// Xử lý lỗi kết nối
redisClient.on("error", (err) => console.error("Lỗi Redis:", err.message, err));

async function fetchUrlsByRedis() {
  const keys = await redisClient.keys("*");
  const urlMap = {};
  console.log("keys", keys);

  for (const key of keys) {
    try {
      const type = await redisClient.type(key);
      console.log(`Key: ${key}, Type: ${type}`);
      urlMap[key] = [];

      if (type === "list") {
        const listItems = await redisClient.lRange(key, 0, -1);
        listItems.forEach((item) => {
          if (isValidUrl(item)) {
            urlMap[key].push(item);
          }
        });
      } else if (type === "string") {
        const value = await redisClient.get(key);
        if (isValidUrl(value)) {
          urlMap[key].push(value);
        }
      }
    } catch (err) {
      console.error(`Lỗi khi xử lý key ${key}:`, err);
      urlMap[key] = [`Error: ${err.message}`];
    }
  }

  // Tạo mảng [{name: key, urls: [...]}, ...]
  const result = keys.map((key) => ({
    name: key,
    urls: urlMap[key] || [],
  }));

  return result;
}

// Hàm kiểm tra xem một chuỗi có phải là URL hợp lệ không
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

async function saveURLListWithTTL(key, urls, ttl) {
  console.log(`Lưu danh sách URL vào Redis với key ${key} và TTL ${ttl} giây`);
  if (Array.isArray(urls)) {
    await redisClient.rPush(key, ...urls);
  } else if (typeof urls === "string") {
    await redisClient.rPush(key, urls); // Nếu là chuỗi, lưu trực tiếp
  }
  await redisClient.expire(key, ttl);
}

//ping redis
const pingRedis = async (redisSub) => {
  try {
    await redisSub.ping();
    // console.log('Redis connection is alive');
  } catch (error) {
    console.error("Redis ping failed:", error);
    try {
      await redisSub.quit();
      await connectRedisSub();
      console.log("Redis reconnected successfully");
    } catch (reconnectError) {
      console.error("Redis reconnection failed:", reconnectError);
    }
  }
};

/**
 * Subscribe to a Redis channel to receive registration links
 * @param {string} channel - The Redis channel to subscribe to
 * @param {function} callback - Callback function to process links (link, exam, modules, date)
 * @returns {Object} - The Redis subscriber client
 */
async function subscribeToRegistrationLinks(channel, callback) {
  try {
    // Make sure subscriber client is connected
    if (!redisSub.isOpen) {
      await connectRedisSub();
    }

    console.log(`Subscribing to Redis channel: ${channel}`);

    // Add a queue status check to track overload condition
    let isProcessingOverloaded = false;
    let skippedLinksCount = 0;
    let lastOverloadLogTime = 0;

    // Subscribe to the channel
    await redisSub.subscribe(channel, (message) => {
      // Get current queue info from the same module that manages the queue
      let queueModule;
      try {
        queueModule = require('./registrationQueue');
        const queueLength = queueModule.getQueueLength();
        const activeBrowsers = queueModule.getActiveBrowserCount();
        const maxBrowsers = 5; // Match the MAX_CONCURRENT_BROWSERS value from registrationQueue.js
        
        // Check if we're overloaded (queue has too many pending items)
        const MAX_QUEUE_SIZE = 25; // Adjust this threshold as needed
        isProcessingOverloaded = (queueLength >= MAX_QUEUE_SIZE && activeBrowsers >= maxBrowsers);
        
        // Log overload status periodically to avoid log spam
        const now = Date.now();
        if (isProcessingOverloaded && (now - lastOverloadLogTime > 60000)) { // Log once per minute
          console.log(`⚠️ System overloaded: Queue length: ${queueLength}, Active browsers: ${activeBrowsers}/${maxBrowsers}, Skipped links: ${skippedLinksCount}`);
          lastOverloadLogTime = now;
        }
      } catch (err) {
        console.error(`Error checking queue status: ${err.message}`);
      }
      
      // Skip processing if system is overloaded
      if (isProcessingOverloaded) {
        skippedLinksCount++;
        return; // Skip this message
      }

      try {
        // Parse the message in format "link@exam@modules@date"
        const parts = message.split("@");

        if (parts.length >= 4) {
          const link = parts[0];
          const exam = parts[1];
          const modules = parts[2];
          const date = parts[3];

          // Validate link
          if (isValidUrl(link)) {
            console.log(`🔗 Processing valid registration link: ${link}\n📝 Exam: ${exam}\n📚 Modules: ${modules}\n📅 Date: ${date}`);
            // Call the callback with parsed data
            callback(link, exam, modules, date);
          } else {
            console.error(`Invalid URL format received: ${link}`);
          }
        } else {
          console.error(
            `Invalid message format. Expected "link@exam@modules@date", got: ${message}`
          );
        }
      } catch (err) {
        console.error(`Error processing Redis message: ${err.message}`);
      }
    });

    console.log(`Successfully subscribed to channel: ${channel}`);
    return redisSub;
  } catch (err) {
    console.error(
      `Error subscribing to Redis channel ${channel}: ${err.message}`
    );
    throw err;
  }
}

module.exports = {
  connectLinkQueue,
  connectRedis,
  connectRedisSub,
  fetchUrlsByRedis,
  disconnectRedis: async () => {
    await redisClient.quit();
    console.log("Đã đóng kết nối Redis.");
  },
  saveURLListWithTTL,
  pingRedis,
  subscribeToRegistrationLinks,
};
