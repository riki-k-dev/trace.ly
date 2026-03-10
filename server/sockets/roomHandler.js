const crypto = require("crypto");
const generateRoomId = require("../utils/generateRoomId");
const { MAX_ROOM_SIZE, PAYLOAD_LIMIT } = require("../config/env");
const {
  createRoom,
  getRoom,
  deleteRoom,
  addUser,
  removeUser,
  updatePresence,
  getRoomPresence,
  redis,
} = require("../rooms/roomManager");

const memoryRateLimits = new Map();

setInterval(() => memoryRateLimits.clear(), 5 * 60 * 1000);

module.exports = function roomHandler(io, socket) {
  const clientId = socket.handshake.auth?.clientId || crypto.randomUUID();
  socket.clientId = clientId;

  const clientIp = socket.handshake.address || "unknown_ip";

  socket.emit("session", { clientId });

  const presenceInterval = setInterval(async () => {
    const roomId = await redis.get(`user:${socket.clientId}:room`);
    if (roomId) {
      const presence = await getRoomPresence(roomId);
      socket.emit("presence-sync", presence);
    }
  }, 20000);

  socket.on("heartbeat", async () => {
    await updatePresence(socket.clientId);
  });

  socket.on("create-room", async ({ expiryHours }) => {
    const existingRoom = await redis.get(`user:${socket.clientId}:room`);
    if (existingRoom) {
      return socket.emit("error", { message: "You are already in a room." });
    }

    const roomId = await generateRoomId(redis);
    const safeExpiry =
      typeof expiryHours === "number" && expiryHours > 0 && expiryHours <= 24
        ? expiryHours
        : 1;
    const expiryTime = Date.now() + safeExpiry * 60 * 60 * 1000;

    await createRoom(roomId, socket.clientId, expiryTime);

    socket.join(roomId);
    socket.emit("room-created", { roomId, expiryTime });
  });

  socket.on("join-room", async ({ roomId }) => {
    const existingRoom = await redis.get(`user:${socket.clientId}:room`);
    if (existingRoom && existingRoom !== roomId) {
      return socket.emit("error", {
        message: "Leave your current room first.",
      });
    }

    const room = await getRoom(roomId);
    if (!room)
      return socket.emit("error", { message: "Room not found or expired." });

    try {
      await addUser(roomId, socket.clientId);
    } catch (error) {
      return socket.emit("error", { message: error.message });
    }

    socket.join(roomId);

    const existingUsers = await redis.smembers(`room:${roomId}:users`);

    socket.emit("room-joined", {
      expiryTime: room.expiryTime,
      existingUsers: existingUsers.filter((id) => id !== socket.clientId),
      isCreator: room.creator === socket.clientId,
    });

    socket.to(roomId).emit("user-joined", { userId: socket.clientId });
  });

  socket.on("end-room", async (roomId) => {
    const room = await getRoom(roomId);
    if (room && room.creator === socket.clientId) {
      io.to(roomId).emit("room-ended");
      io.in(roomId).socketsLeave(roomId);
      await deleteRoom(roomId);
    }
  });

  socket.on("leave-room", async (roomId) => {
    const removedRoomId = await removeUser(socket.clientId);
    if (removedRoomId) {
      socket.leave(removedRoomId);
      io.to(removedRoomId).emit("peer-disconnected", {
        userId: socket.clientId,
      });
      io.to(removedRoomId).emit("user-left", { userId: socket.clientId });
    }
  });

  socket.on("send-location", async ({ roomId, payload }) => {
    const now = Date.now();
    const limitKey = `${clientIp}:${socket.clientId}`;
    const limitRecord = memoryRateLimits.get(limitKey) || {
      count: 0,
      time: now,
    };

    if (now - limitRecord.time > 2000) {
      limitRecord.count = 0;
      limitRecord.time = now;
    }

    limitRecord.count++;
    memoryRateLimits.set(limitKey, limitRecord);

    if (limitRecord.count > 4) return;

    if (
      typeof payload !== "object" ||
      typeof payload.iv !== "string" ||
      typeof payload.data !== "string" ||
      typeof payload.signature !== "string" ||
      payload.data.length > PAYLOAD_LIMIT
    )
      return;

    const userRoom = await redis.get(`user:${socket.clientId}:room`);
    if (userRoom !== roomId) return;

    socket.to(roomId).emit("receive-location", {
      id: socket.clientId,
      payload,
      timestamp: Date.now(),
    });
  });

  socket.join(socket.clientId);

  socket.on("disconnect", async () => {
    clearInterval(presenceInterval);
    setTimeout(async () => {
      const activeSockets = await io.in(socket.clientId).fetchSockets();
      if (activeSockets.length === 0) {
        const roomId = await removeUser(socket.clientId);
        if (roomId) {
          io.to(roomId).emit("peer-disconnected", { userId: socket.clientId });
          io.to(roomId).emit("user-left", { userId: socket.clientId });
        }
      }
    }, 5000);
  });
};
