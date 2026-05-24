let inMemorySet = new Set();

export async function setOnline(userId) {
  inMemorySet.add(Number(userId));
  return true;
}

export async function setOffline(userId) {
  inMemorySet.delete(Number(userId));
  return true;
}

export async function getOnlineUsers() {
  return Array.from(inMemorySet.values());
}

export async function isOnline(userId) {
  return inMemorySet.has(Number(userId));
}

export default {
  setOnline,
  setOffline,
  getOnlineUsers,
  isOnline
};
