// Redis is not used in this project.
// Keep this module as a safe no-op to preserve existing imports without adding a runtime dependency.

export function createRedisClient() {
  return {};
}

export default createRedisClient;
