const Redis = require("ioredis");
const { REDIS_URL, MAX_ROOM_SIZE } = require("../config/env");

const redis = new Redis(REDIS_URL);

const JOIN_ROOM_SCRIPT = `
  local current_size = redis.call('SCARD', KEYS[1])
  if current_size >= tonumber(ARGV[1]) then
    return -1
  end
  redis.call('SADD', KEYS[1], ARGV[2])
  return 1
`;

async function createRoom(roomId, creatorId, expiryTime) {
  const ttlSeconds = Math.ceil((expiryTime - Date.now()) / 1000);
  if (ttlSeconds <= 0) return false;

  const pipeline = redis.pipeline();
  pipeline.hset(`room:${roomId}`, {
    creator: creatorId,
    expiryTime: expiryTime.toString(),
  });
  pipeline.expire(`room:${roomId}`, ttlSeconds);
  await pipeline.exec();

  await addUser(roomId, creatorId);
  return true;
}

async function getRoom(roomId) {
  const room = await redis.hgetall(`room:${roomId}`);
  if (!room || Object.keys(room).length === 0) return null;

  if (Date.now() > parseInt(room.expiryTime, 10)) {
    await deleteRoom(roomId);
    return null;
  }
  return {
    creator: room.creator,
    expiryTime: parseInt(room.expiryTime, 10),
  };
}

async function deleteRoom(roomId) {
  const users = await redis.smembers(`room:${roomId}:users`);
  const pipeline = redis.pipeline();
  pipeline.del(`room:${roomId}`);
  pipeline.del(`room:${roomId}:users`);

  users.forEach((userId) => {
    pipeline.del(`user:${userId}:room`);
    pipeline.del(`presence:${userId}`);
  });

  await pipeline.exec();
}

async function addUser(roomId, userId) {
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
  await pipeline.exec();

  await updatePresence(userId);
}

async function removeUser(userId) {
  const roomId = await redis.get(`user:${userId}:room`);
  if (roomId) {
    const pipeline = redis.pipeline();
    pipeline.srem(`room:${roomId}:users`, userId);
    pipeline.del(`user:${userId}:room`);
    pipeline.del(`presence:${userId}`);
    await pipeline.exec();
    return roomId;
  }
  return null;
}

async function updatePresence(userId) {
  await redis.set(`presence:${userId}`, "active", "EX", 15);
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
  removeUser,
  updatePresence,
  getRoomPresence,
};
