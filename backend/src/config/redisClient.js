require('dotenv').config();
const redis = require('redis');
const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';
const redisUrl = isTest ? null : (process.env.REDIS_URL || (isProduction ? null : 'redis://127.0.0.1:6379'));

let client = null;

if (redisUrl) {
  client = redis.createClient({
    url: redisUrl,
    socket: {
      connectTimeout: 2000,
      reconnectStrategy: (retries) => {
        if (retries > 2) {
          return false; // Ngưng kết nối lại nếu redis không chạy
        }
        return 100;
      }
    }
  });

  client.on('error', (err) => {
    if (process.env.REDIS_URL || !isProduction) {
      console.log('Redis Client Notice:', err.message);
    }
  });
  client.on('connect', () => console.log('✅ Redis Connected'));

  (async () => {
    try {
      await client.connect();
    } catch (err) {
      console.log('ℹ️ Redis Connection Failed (Using Fallback Mode)');
    }
  })();
} else {
  console.log('ℹ️ Redis not configured or test mode, skipping connection (Fallback mode)');
  // Create a dummy client object to prevent crashes if other files import it
  client = {
    on: () => { },
    get: async () => null,
    set: async () => 'OK',
    del: async () => 1,
    incr: async () => 1,
    rPush: async () => 1,
    lRange: async () => [],
    exists: async () => 0,
    expire: async () => 1,
    connect: async () => { },
    disconnect: async () => { },
  };
}

module.exports = client;