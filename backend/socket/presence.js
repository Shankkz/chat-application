const Redis = require('ioredis');

// ── In-Memory Fallback ──────────────────────────────────────────────────────
class MemoryPresence {
  constructor() {
    this.onlineUsers = new Set();
    this.socketMap = new Map(); // userId -> socketId
  }
  async setOnline(userId, socketId) {
    this.onlineUsers.add(userId);
    this.socketMap.set(userId, socketId);
  }
  async setOffline(userId) {
    this.onlineUsers.delete(userId);
    this.socketMap.delete(userId);
  }
  async getOnlineUsers() {
    return Array.from(this.onlineUsers);
  }
  async getSocketId(userId) {
    return this.socketMap.get(userId);
  }
  async findUserBySocket(socketId) {
    for (const [userId, sid] of this.socketMap.entries()) {
      if (sid === socketId) return userId;
    }
    return null;
  }
}

let redisClient;
let useMemory = false;
const memoryProvider = new MemoryPresence();

const getRedisClient = () => {
  if (useMemory) return null;
  if (!redisClient) {
    const url = process.env.REDIS_URL || 'redis://localhost:6379';
    redisClient = new Redis(url, {
      lazyConnect: true,
      maxRetriesPerRequest: 1, // Fail fast to trigger fallback
      retryStrategy: (times) => (times > 3 ? null : 1000), // Stop retrying after 3 attempts
    });

    redisClient.on('error', (err) => {
      console.error('[Redis] Error:', err.message);
      if (!useMemory) {
        console.warn('[Presence] Redis unreachable. Falling back to in-memory tracking.');
        useMemory = true;
      }
    });

    redisClient.on('connect', () => {
      console.log('[Redis] Connected');
      useMemory = false;
    });
  }
  return redisClient;
};

const PRESENCE_PREFIX = 'presence:';
const SOCKET_PREFIX  = 'socket:';

const setOnline = async (userId, socketId) => {
  try {
    const redis = getRedisClient();
    if (redis && !useMemory) {
      await redis.set(`${PRESENCE_PREFIX}${userId}`, '1');
      await redis.set(`${SOCKET_PREFIX}${userId}`, socketId);
      await redis.sadd('online_users', userId);
      return;
    }
  } catch (err) {
    useMemory = true;
  }
  await memoryProvider.setOnline(userId, socketId);
};

const setOffline = async (userId) => {
  try {
    const redis = getRedisClient();
    if (redis && !useMemory) {
      await redis.del(`${PRESENCE_PREFIX}${userId}`);
      await redis.del(`${SOCKET_PREFIX}${userId}`);
      await redis.srem('online_users', userId);
      return;
    }
  } catch (err) {
    useMemory = true;
  }
  await memoryProvider.setOffline(userId);
};

const getOnlineUsers = async () => {
  try {
    const redis = getRedisClient();
    if (redis && !useMemory) {
      return await redis.smembers('online_users');
    }
  } catch (err) {
    useMemory = true;
  }
  return await memoryProvider.getOnlineUsers();
};

const getSocketId = async (userId) => {
  try {
    const redis = getRedisClient();
    if (redis && !useMemory) {
      return await redis.get(`${SOCKET_PREFIX}${userId}`);
    }
  } catch (err) {
    useMemory = true;
  }
  return await memoryProvider.getSocketId(userId);
};

const findUserBySocket = async (socketId) => {
  try {
    const redis = getRedisClient();
    if (redis && !useMemory) {
      const onlineIds = await redis.smembers('online_users');
      for (const userId of onlineIds) {
        const sid = await redis.get(`${SOCKET_PREFIX}${userId}`);
        if (sid === socketId) return userId;
      }
      return null;
    }
  } catch (err) {
    useMemory = true;
  }
  return await memoryProvider.findUserBySocket(socketId);
};

module.exports = { setOnline, setOffline, getOnlineUsers, getSocketId, findUserBySocket };
