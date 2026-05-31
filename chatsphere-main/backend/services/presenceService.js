let inMemorySet = new Set();

export async function setOnline(userId) {
  const id = Number(userId);
  inMemorySet.add(id);
  console.debug('[presence] setOnline', { userId: id, onlineCount: inMemorySet.size, at: new Date().toISOString() });
  return true;
}

export async function setOffline(userId) {
  const id = Number(userId);
  inMemorySet.delete(id);
  console.debug('[presence] setOffline', { userId: id, onlineCount: inMemorySet.size, at: new Date().toISOString() });
  return true;
}

export async function getOnlineUsers() {
  console.debug('[presence] getOnlineUsers', { onlineCount: inMemorySet.size, at: new Date().toISOString() });
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
