const redis = require('redis');
const isProduction = process.env.NODE_ENV === 'production';
const redisUrl = process.env.REDIS_URL || (isProduction ? null : 'redis://redis:6379');

let client = null;

if (redisUrl) {
  client = redis.createClient({ url: redisUrl });
  client.on('error', (err) => {
    // Only log critical errors if a custom Redis URL was provided
    if (process.env.REDIS_URL || !isProduction) {
      console.log('Redis Client Error', err);
    }
  });
  client.on('connect', () => console.log('✅ Redis Connected'));

  (async () => {
    try {
      await client.connect();
    } catch (err) {
      if (process.env.REDIS_URL || !isProduction) {
        console.log('Redis Connection Failed');
      }
    }
  })();
} else {
  console.log('ℹ️ Redis not configured, skipping connection (Fallback mode)');
  // Create a dummy client object to prevent crashes if other files import it
  client = {
    on: () => { },
    get: async () => null,
    set: async () => null,
    del: async () => null,
    exists: async () => 0,
    expire: async () => null,
    connect: async () => { },
    disconnect: async () => { },
  };
}

module.exports = client;