const crypto = require("crypto");

async function generateRoomId(redis) {
  let roomId;
  let exists = 1;

  while (exists === 1) {
    roomId = crypto.randomBytes(8).toString("hex");
    exists = await redis.exists(`room:${roomId}`);
  }

  return roomId;
}

module.exports = generateRoomId;
