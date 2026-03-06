const express = require("express");
const http = require("http");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");

const { PORT, CLIENT_URL, MAX_ROOM_SIZE } = require("./config/env");
const roomHandler = require("./sockets/roomHandler");
const { redis, getRoom } = require("./rooms/roomManager");

const app = express();
app.use(helmet());
app.use(cors({ origin: CLIENT_URL }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests, please try again later.",
});
app.use("/api/", apiLimiter);

app.get("/api/room/:id/status", async (req, res) => {
  try {
    const roomId = req.params.id;
    const room = await getRoom(roomId);

    if (!room) {
      return res.status(404).json({ error: "Room not found or expired" });
    }

    const users = await redis.smembers(`room:${roomId}:users`);

    res.json({
      active: true,
      expiryTime: room.expiryTime,
      participants: users.length,
      maxCapacity: MAX_ROOM_SIZE,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ["GET", "POST"],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

async function startServer() {
  const pubClient = redis.duplicate();
  const subClient = redis.duplicate();

  io.adapter(createAdapter(pubClient, subClient));

  io.on("connection", (socket) => {
    roomHandler(io, socket);
  });

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT} with robust Redis clustering`);
  });
}

startServer();
