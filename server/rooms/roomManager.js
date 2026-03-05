const rooms = new Map();

function createRoom(roomId, creatorId, expiryTime) {
  rooms.set(roomId, {
    creator: creatorId,
    expiryTime,
    users: new Set([creatorId]),
  });
}

function getRoom(roomId) {
  return rooms.get(roomId);
}

function deleteRoom(roomId) {
  rooms.delete(roomId);
}

function addUser(roomId, userId) {
  const room = rooms.get(roomId);
  if (!room) return;
  room.users.add(userId);
}

function removeUser(userId) {
  for (const [roomId, room] of rooms) {
    if (room.users.has(userId)) {
      room.users.delete(userId);
      return roomId;
    }
  }
}

function cleanupExpiredRooms(io) {
  setInterval(() => {
    const now = Date.now();

    for (const [roomId, room] of rooms) {
      if (now > room.expiryTime) {
        io.to(roomId).emit("room-ended");
        io.socketsLeave(roomId);
        rooms.delete(roomId);
      }
    }
  }, 60000);
}

module.exports = {
  createRoom,
  getRoom,
  deleteRoom,
  addUser,
  removeUser,
  cleanupExpiredRooms,
};
