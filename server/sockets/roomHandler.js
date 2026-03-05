const generateRoomId = require("../utils/generateRoomId");
const {
  createRoom,
  getRoom,
  deleteRoom,
  addUser,
  removeUser,
} = require("../rooms/roomManager");

module.exports = function roomHandler(io, socket) {
  socket.on("create-room", ({ expiryHours }) => {
    const roomId = generateRoomId();
    const expiryTime = Date.now() + expiryHours * 60 * 60 * 1000;

    createRoom(roomId, socket.id, expiryTime);

    socket.join(roomId);

    socket.emit("room-created", { roomId, expiryTime });
  });

  socket.on("join-room", (roomId) => {
    const room = getRoom(roomId);

    if (!room) {
      return socket.emit("error", { message: "Room not found." });
    }

    if (Date.now() > room.expiryTime) {
      deleteRoom(roomId);
      return socket.emit("error", { message: "Room expired." });
    }

    addUser(roomId, socket.id);

    socket.join(roomId);

    socket.emit("room-joined", {
      expiryTime: room.expiryTime,
    });
  });

  socket.on("send-location", ({ roomId, latitude, longitude }) => {
    const room = getRoom(roomId);

    if (!room) return;

    socket.to(roomId).emit("receive-location", {
      id: socket.id,
      latitude,
      longitude,
    });
  });

  socket.on("end-room", (roomId) => {
    const room = getRoom(roomId);

    if (!room) return;

    if (room.creator !== socket.id) return;

    io.to(roomId).emit("room-ended");

    io.socketsLeave(roomId);

    deleteRoom(roomId);
  });

  socket.on("disconnect", () => {
    const roomId = removeUser(socket.id);

    if (roomId) {
      io.to(roomId).emit("user-left", { userId: socket.id });
    }
  });
};
