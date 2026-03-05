const express = require("express");
const http = require("http");
const cors = require("cors");
const helmet = require("helmet");
const { Server } = require("socket.io");

const { PORT, CLIENT_URL } = require("./config/env");
const roomHandler = require("./sockets/roomHandler");
const { cleanupExpiredRooms } = require("./rooms/roomManager");

const app = express();

app.use(helmet());
app.use(cors({ origin: CLIENT_URL }));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  roomHandler(io, socket);
});

cleanupExpiredRooms(io);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
