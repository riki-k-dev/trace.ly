require("dotenv").config();

module.exports = {
  PORT: process.env.PORT || 5000,
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:3000",
  REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",
  MAX_ROOM_SIZE: 50,
  PAYLOAD_LIMIT: 5000,
};
