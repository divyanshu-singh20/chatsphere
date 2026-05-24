Socket layer

- `socket/index.js` (existing) — initializes socket.io and currently contains event handlers.
- `socket/manager.js` (new) — central helper to manage user→socket mappings and expose safe emit/join APIs.

Strategy

- Keep `socket/index.js` working as-is. Incrementally refactor to use `manager.js` and `services/*`.
- Enable Redis adapter through `USE_REDIS_ADAPTER=true` and `REDIS_URL`.

Events to maintain or add:
- message:new, message:sent, message:delivered, message:seen
- typing:start, typing:stop
- call:* (incoming/accepted/rejected/ended/ice)
- user:online, user:offline
