/*
  SocketManager: small utility wrapper around socket.io `io`.
  - Non-invasive scaffold to centralize socket operations
  - Keeps userId -> Set(socketId) mapping and exposes helpers
*/

let ioInstance = null;
const userSockets = new Map(); // userId -> Set(socketId)

export function initSocketManager(io, opts = {}) {
  if (ioInstance) return ioInstance;
  ioInstance = io;

  return ioInstance;
}

export function registerUserSocket(userId, socketId) {
  const id = Number(userId);
  const existing = userSockets.get(id) || new Set();
  existing.add(socketId);
  userSockets.set(id, existing);
}

export function unregisterUserSocket(userId, socketId) {
  const id = Number(userId);
  const sockets = userSockets.get(id);
  if (!sockets) return;
  sockets.delete(socketId);
  if (sockets.size === 0) userSockets.delete(id);
  else userSockets.set(id, sockets);
}

export function getSocketsForUser(userId) {
  const set = userSockets.get(Number(userId));
  if (!set) return [];
  return Array.from(set);
}

export function emitToUser(userId, event, payload) {
  if (!ioInstance) return;
  const sockets = getSocketsForUser(userId);
  sockets.forEach((sid) => ioInstance.to(sid).emit(event, payload));
}

export function broadcastRoom(room, event, payload) {
  if (!ioInstance) return;
  ioInstance.to(room).emit(event, payload);
}

export function joinRoom(socket, room) {
  if (!socket) return;
  socket.join(room);
}

export function leaveRoom(socket, room) {
  if (!socket) return;
  socket.leave(room);
}

export function getOnlineUserIds() {
  return Array.from(userSockets.keys());
}

export default {
  init: initSocketManager,
  registerUserSocket,
  unregisterUserSocket,
  getSocketsForUser,
  emitToUser,
  broadcastRoom,
  joinRoom,
  leaveRoom,
  getOnlineUserIds
};
