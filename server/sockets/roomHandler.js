const crypto = require("crypto");
const generateRoomId = require("../utils/generateRoomId");
const { MAX_ROOM_SIZE, PAYLOAD_LIMIT } = require("../config/env");
const {
  createRoom,
  getRoom,
  deleteRoom,
  addUser,
  getUserName,
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

  socket.on(
    "create-room",
    async ({ expiryHours, username, pin, requiresApproval }) => {
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

      const safePin = String(pin || "").trim();
      const pinHash = safePin
        ? crypto.createHash("sha256").update(safePin).digest("hex")
        : "";

      await createRoom(
        roomId,
        socket.clientId,
        expiryTime,
        pinHash,
        requiresApproval,
        username || "Creator",
      );

      socket.join(roomId);
      socket.emit("room-created", { roomId, expiryTime });
    },
  );

  socket.on("check-room", async (roomId) => {
    const room = await getRoom(roomId);
    if (!room) return socket.emit("room-not-found");
    socket.emit("room-info", {
      hasPin: room.hasPin,
      requiresApproval: room.requiresApproval,
    });
  });

  socket.on("request-join", async ({ roomId, username, pin }) => {
    const existingRoom = await redis.get(`user:${socket.clientId}:room`);
    if (existingRoom && existingRoom !== roomId) {
      return socket.emit("join-error", {
        message: "Leave your current room first.",
      });
    }

    const room = await getRoom(roomId);
    if (!room)
      return socket.emit("join-error", {
        message: "Room not found or expired.",
      });

    const isCreator = room.creator === socket.clientId;

    const isRejected = await redis.sismember(
      `room:${roomId}:rejected`,
      socket.clientId,
    );
    if (!isCreator && isRejected) {
      return socket.emit("join-rejected");
    }

    const isAlreadyApproved = await redis.sismember(
      `room:${roomId}:approved`,
      socket.clientId,
    );

    if (!isCreator && !isAlreadyApproved) {
      if (room.hasPin) {
        const safeSubmittedPin = String(pin || "").trim();
        const hash = crypto
          .createHash("sha256")
          .update(safeSubmittedPin)
          .digest("hex");
        if (hash !== room.pinHash) {
          return socket.emit("join-error", { message: "Invalid Room PIN." });
        }
      }

      if (room.requiresApproval) {
        io.to(room.creator).emit("join-request", {
          userId: socket.id,
          username,
        });
        return socket.emit("join-pending");
      }
    }

    await redis.sadd(`room:${roomId}:approved`, socket.clientId);
    await redis.expire(`room:${roomId}:approved`, 24 * 60 * 60);

    await performJoin(socket, roomId, username, room);
  });

  socket.on("resolve-join", async ({ roomId, userId, username, approved }) => {
    const room = await getRoom(roomId);
    if (!room || room.creator !== socket.clientId) return;

    const targetSockets = await io.sockets.in(userId).fetchSockets();
    if (targetSockets.length > 0) {
      const targetClient = targetSockets[0].clientId;

      if (approved) {
        await redis.sadd(`room:${roomId}:approved`, targetClient);
        await redis.expire(`room:${roomId}:approved`, 24 * 60 * 60);
        await performJoin(targetSockets[0], roomId, username, room);
      } else {
        await redis.sadd(`room:${roomId}:rejected`, targetClient);
        await redis.expire(`room:${roomId}:rejected`, 24 * 60 * 60);
        io.to(userId).emit("join-rejected");
      }
    } else {
      io.to(userId).emit("join-rejected");
    }
  });

  async function performJoin(targetSocket, roomId, username, room) {
    try {
      await addUser(roomId, targetSocket.clientId, username);
    } catch (error) {
      return targetSocket.emit("join-error", { message: error.message });
    }

    targetSocket.join(roomId);

    const existingUsers = await redis.smembers(`room:${roomId}:users`);
    const existingUsersWithNames = [];

    for (const id of existingUsers) {
      if (id !== targetSocket.clientId) {
        const name = await getUserName(id);
        existingUsersWithNames.push({ id, username: name });
      }
    }

    targetSocket.emit("room-joined", {
      expiryTime: room.expiryTime,
      existingUsers: existingUsersWithNames,
      isCreator: room.creator === targetSocket.clientId,
    });

    targetSocket
      .to(roomId)
      .emit("user-joined", { userId: targetSocket.clientId, username });
  }

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
