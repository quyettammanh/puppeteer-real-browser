// redis.js
const redis = require('redis');
const { promisify } = require('util');
const dotenv = require('dotenv');

// Nạp biến môi trường từ file .env
dotenv.config();

// Cấu hình kết nối Redis
const redisClient = redis.createClient({
    socket: {
        host: process.env.REDIS_HOST || 'localhost',
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

const connectLinkQueue = "redis://" + process.env.REDIS_HOST + ":" + process.env.REDIS_PORT;

const connectRedis = async () => {
    try {
        await redisClient.connect();
    } catch (err) {
        console.error('Không thể kết nối Redis:', err.message);
        setTimeout(() => connectRedis(client), 5000);
    }
};

const connectRedisSub = async () => {
    try {
        await redisSub.connect();
        return redisSub;
    } catch (err) {
        console.error('Không thể kết nối Redis:', err.message);
        setTimeout(() => connectRedis(client), 5000);
    }
}

// Xử lý lỗi kết nối
redisClient.on('error', (err) => console.error('Lỗi Redis:', err.message, err));


async function fetchUrlsByRedis() {
    const keys = await redisClient.keys('*');
    const urlMap = {};
    console.log('keys', keys);

    for (const key of keys) {
        try {
            const type = await redisClient.type(key);
            console.log(`Key: ${key}, Type: ${type}`);
            urlMap[key] = [];

            if (type === 'list') {
                const listItems = await redisClient.lRange(key, 0, -1);
                listItems.forEach(item => {
                    if (isValidUrl(item)) {
                        urlMap[key].push(item);
                    }
                });
            } else if (type === 'string') {
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
    const result = keys.map(key => ({
        name: key,
        urls: urlMap[key] || []
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
    } else if (typeof urls === 'string') {
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
        console.error('Redis ping failed:', error);
        try {
            await redisSub.quit();
            await connectRedisSub();
            console.log('Redis reconnected successfully');
        } catch (reconnectError) {
            console.error('Redis reconnection failed:', reconnectError);
        }
    }
};

module.exports = {
    connectLinkQueue,
    connectRedis,
    connectRedisSub,
    fetchUrlsByRedis,
    disconnectRedis: async () => {
        await redisClient.quit();
        console.log('Đã đóng kết nối Redis.');
    },
    saveURLListWithTTL,
    pingRedis,
};
