const redis = require('redis');

const isProduction = process.env.NODE_ENV === 'production';
let redisUrl = process.env.REDIS_URL;

if (!redisUrl && !isProduction) {
  redisUrl = 'redis://127.0.0.1:6379';
}

function createSafeRedisClient(url) {
  let hasLoggedError = false;
  const dummy = {
    isOpen: false,
    isReady: false,
    on: () => { },
    get: async () => null,
    set: async () => null,
    setEx: async () => null,
    del: async () => null,
    keys: async () => [],
    exists: async () => 0,
    expire: async () => null,
    connect: async () => { },
    disconnect: async () => { },
  };

  if (!url) {
    console.log('ℹ️ Redis not configured, skipping connection (Fallback mode)');
    return dummy;
  }

  const realClient = redis.createClient({
    url,
    socket: {
      reconnectStrategy: (retries) => {
        // Stop reconnecting after 2 retries if connection fails
        if (retries >= 2) return false;
        return 200;
      }
    }
  });

  realClient.on('error', (err) => {
    if (!hasLoggedError) {
      console.warn(`⚠️ Redis Client Warning (${url}): ${err.message}. Operating in Fallback mode.`);
      hasLoggedError = true;
    }
  });

  realClient.on('connect', () => {
    hasLoggedError = false;
    console.log('✅ Redis Connected');
  });

  (async () => {
    try {
      await realClient.connect();
    } catch (err) {
      if (!hasLoggedError) {
        console.warn(`⚠️ Redis Connection Failed (${url}). Operating in Fallback mode.`);
        hasLoggedError = true;
      }
    }
  })();

  return new Proxy(realClient, {
    get(target, prop, receiver) {
      if (prop === 'isOpen') {
        return target.isOpen || false;
      }
      if (prop === 'isReady') {
        return target.isReady || false;
      }
      const orig = Reflect.get(target, prop, receiver);
      if (typeof orig === 'function') {
        return async function (...args) {
          if (!target.isOpen && prop !== 'connect' && prop !== 'disconnect' && prop !== 'on') {
            return dummy[prop] ? dummy[prop](...args) : null;
          }
          try {
            return await orig.apply(target, args);
          } catch (err) {
            console.warn(`Redis command warning (${prop}):`, err.message);
            return dummy[prop] ? dummy[prop](...args) : null;
          }
        };
      }
      return orig;
    }
  });
}

const client = createSafeRedisClient(redisUrl);

module.exports = client;