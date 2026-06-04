const Redis = require("ioredis");
const { REDIS_URL, MAX_ROOM_SIZE } = require("../config/env");

const isSecure = REDIS_URL && REDIS_URL.startsWith("rediss://");

const redisOptions = {
  family: 4,
  enableOfflineQueue: false,
  maxRetriesPerRequest: 3,
  keepAlive: 10000,
  ...(isSecure && { tls: { rejectUnauthorized: false } }),
  retryStrategy(times) {
    return Math.min(times * 100, 3000);
  },
};

const redis = new Redis(REDIS_URL, redisOptions);

redis.on("error", (err) => {
  console.error("Redis Connection Error:", err.message);
});

const roomCache = new Map();
const CACHE_TTL = 30 * 1000;

setInterval(
  () => {
    const now = Date.now();
    for (const [roomId, cached] of roomCache.entries()) {
      if (now > cached.expiresAt) {
        roomCache.delete(roomId);
      }
    }
  },
  5 * 60 * 1000,
);

const JOIN_ROOM_SCRIPT = `
  local current_size = redis.call('SCARD', KEYS[1])
  if current_size >= tonumber(ARGV[1]) then
    return -1
  end
  redis.call('SADD', KEYS[1], ARGV[2])
  return 1
`;

async function createRoom(
  roomId,
  creatorId,
  expiryTime,
  pinHash = "",
  requiresApproval = false,
  creatorUsername = "Creator",
) {
  const ttlSeconds = Math.ceil((expiryTime - Date.now()) / 1000);
  if (ttlSeconds <= 0) return false;

  const pipeline = redis.pipeline();
  pipeline.hset(`room:${roomId}`, {
    creator: creatorId,
    expiryTime: expiryTime.toString(),
    pinHash,
    requiresApproval: requiresApproval ? "true" : "false",
  });
  pipeline.expire(`room:${roomId}`, ttlSeconds);
  await pipeline.exec();

  await addUser(roomId, creatorId, creatorUsername);
  return true;
}

async function getRoom(roomId) {
  const now = Date.now();

  const cachedRoom = roomCache.get(roomId);
  if (cachedRoom && cachedRoom.expiresAt > now) {
    return cachedRoom.data;
  }

  const room = await redis.hgetall(`room:${roomId}`);
  if (!room || Object.keys(room).length === 0) return null;

  if (now > parseInt(room.expiryTime, 10)) {
    await deleteRoom(roomId);
    return null;
  }

  const roomData = {
    creator: room.creator,
    expiryTime: parseInt(room.expiryTime, 10),
    hasPin: !!room.pinHash,
    pinHash: room.pinHash || "",
    requiresApproval: room.requiresApproval === "true",
  };

  roomCache.set(roomId, {
    data: roomData,
    expiresAt: now + CACHE_TTL,
  });

  return roomData;
}

async function deleteRoom(roomId) {
  roomCache.delete(roomId);

  const users = await redis.smembers(`room:${roomId}:users`);
  const pipeline = redis.pipeline();

  pipeline.del(`room:${roomId}`);
  pipeline.del(`room:${roomId}:users`);

  users.forEach((userId) => {
    pipeline.del(`user:${userId}:room`);
    pipeline.del(`user:${userId}:name`);
  });

  await pipeline.exec();
}

async function addUser(roomId, userId, username = "Unknown") {
  const roomTtl = await redis.ttl(`room:${roomId}`);
  const ttl = roomTtl > 0 ? roomTtl : 3600;

  const result = await redis.eval(
    JOIN_ROOM_SCRIPT,
    1,
    `room:${roomId}:users`,
    MAX_ROOM_SIZE,
    userId,
  );

  if (result === -1) {
    throw new Error("Room is at maximum capacity.");
  }

  const pipeline = redis.pipeline();
  pipeline.expire(`room:${roomId}:users`, ttl);
  pipeline.set(`user:${userId}:room`, roomId, "EX", ttl);
  pipeline.set(`user:${userId}:name`, username, "EX", ttl);
  await pipeline.exec();

  await updatePresence(userId);
}

async function getUserName(userId) {
  const name = await redis.get(`user:${userId}:name`);
  return name || userId.substring(0, 5);
}

async function removeUser(userId) {
  const roomId = await redis.get(`user:${userId}:room`);
  if (roomId) {
    const pipeline = redis.pipeline();
    pipeline.srem(`room:${roomId}:users`, userId);
    pipeline.del(`user:${userId}:room`);
    pipeline.del(`user:${userId}:name`);
    await pipeline.exec();
    return roomId;
  }
  return null;
}

async function updatePresence(userId) {
  await redis.set(`presence:${userId}`, "active", "EX", 45);
}

async function getRoomPresence(roomId) {
  const users = await redis.smembers(`room:${roomId}:users`);
  if (users.length === 0) return {};

  const keys = users.map((id) => `presence:${id}`);
  const statuses = await redis.mget(keys);

  const presence = {};
  users.forEach((id, index) => {
    presence[id] = statuses[index] === "active";
  });
  return presence;
}

module.exports = {
  redis,
  createRoom,
  getRoom,
  deleteRoom,
  addUser,
  getUserName,
  removeUser,
  updatePresence,
  getRoomPresence,
};
