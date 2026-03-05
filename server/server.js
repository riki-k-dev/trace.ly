const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const crypto = require("crypto");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const activeRooms = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("create-room", ({ expiryHours }) => {
    const roomId = crypto.randomBytes(3).toString("hex");
    const expiryTime = Date.now() + expiryHours * 60 * 60 * 1000;

    activeRooms[roomId] = {
      creator: socket.id,
      expiryTime,
      users: new Set([socket.id]),
    };

    socket.join(roomId);
    socket.emit("room-created", { roomId, expiryTime });
  });

  socket.on("join-room", (roomId) => {
    const room = activeRooms[roomId];

    if (!room) {
      return socket.emit("error", { message: "Room not found." });
    }

    if (Date.now() > room.expiryTime) {
      delete activeRooms[roomId];
      return socket.emit("error", { message: "Room expired." });
    }

    socket.join(roomId);
    room.users.add(socket.id);

    socket.emit("room-joined", { expiryTime: room.expiryTime });
  });

  socket.on("send-location", ({ roomId, latitude, longitude }) => {
    socket.to(roomId).emit("receive-location", {
      id: socket.id,
      latitude,
      longitude,
    });
  });

  socket.on("end-room", (roomId) => {
    const room = activeRooms[roomId];

    if (room && room.creator === socket.id) {
      io.to(roomId).emit("room-ended");
      io.socketsLeave(roomId);
      delete activeRooms[roomId];
    }
  });

  socket.on("disconnect", () => {
    for (const roomId in activeRooms) {
      if (activeRooms[roomId].users.has(socket.id)) {
        activeRooms[roomId].users.delete(socket.id);
        io.to(roomId).emit("user-left", { userId: socket.id });
      }
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
