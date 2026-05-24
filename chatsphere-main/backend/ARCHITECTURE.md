# Backend Architecture — WhatsApp-like Realtime System

This document outlines recommended folder structure, socket architecture, database schema, APIs, WebRTC signaling flow, security, scalability and reliability improvements. All changes in this repo must preserve existing behavior; new files are scaffolds and docs only.

## 1) Recommended Folder Structure

backend/
- config/          # environment, redis, cloud storage, feature flags
- controllers/     # express controllers (http handlers)
- routes/          # express routes -> controllers
- services/        # core business logic (message, call, presence, media)
- repositories/    # DB access / sequelize queries
- socket/          # socket initialization + manager + event handlers
- middleware/      # auth, rate-limit, validation
- models/          # sequelize models
- utils/           # helpers (jwt, validation, retry, heartbeat)
- validators/      # request validators
- jobs/            # background jobs (queue processors)
- migrations/      # db migrations / seeds
- docs/            # design docs, diagrams

Keep controllers thin. Business logic must live in `services/`. Database queries live in `repositories/` to make them testable and replaceable.

## 2) Socket.io Architecture

- Centralized SocketManager that owns `io` instance and exposes safe APIs:
  - `init(server, opts)` — initialize io + adapters
  - `registerUserSocket(userId, socketId)` / `unregisterUserSocket(userId, socketId)`
  - `getSockets(userId)` / `emitToUser(userId, event, payload)`
  - `joinRoom(socketId, room)` / `leaveRoom(socketId, room)`
  - `broadcastRoom(room, event, payload)`

- Presence and mapping:
  - Maintain `userId -> Set(socketId)` map.
  - Persist presence to Redis for multi-instance visibility.

- Scaling:
  - Use `socket.io-redis` / `@socket.io/redis-adapter` for pub/sub across instances.
  - Use Redis for presence pub/sub so `online` lists are accurate across nodes.

- Authentication & security:
  - Authenticate sockets via JWT in `io.use()` (current implementation) and validate claims.
  - Rate-limit sensitive events (call signaling, media offers).

- Event flow (required events):
  - `message:new` — client sends optimistic message -> service persists -> manager emits `message:sent` to sender and `message:delivered`/`message:received` to recipients
  - `message:seen` — client notifies server -> update message status -> emit `message:seen` to sender
  - `typing:start` / `typing:stop`
  - `call:incoming`, `call:accepted`, `call:rejected`, `call:ended`
  - `user:online` / `user:offline`

Event cleanup: timeouts and pendingCall maps must be stored centrally and optionally replicated via Redis.

## 3) Database Schema Improvements (high level)

Important: maintain existing models and migrate gradually. The following are recommended tables/columns.

- `users` (existing):
  - id, username, displayName, avatarUrl, isOnline (boolean), lastSeenAt, statusMessage, createdAt, updatedAt

- `chats`:
  - id, type enum('private','group'), title, avatarUrl, lastMessageId, createdAt, updatedAt

- `chat_participants`:
  - id, chatId, userId, role(enum), unreadCount, joinedAt

- `messages`:
  - id, chatId, senderId, content (TEXT), media (JSON), replyToMessageId, status enum('pending','sent','delivered','seen'), clientMsgId (optional optimistic id), createdAt, deliveredAt, seenAt
  - indexes: (chatId, createdAt), (senderId, createdAt)

- `calls`:
  - id, chatId, callerId, calleeId, type enum('voice','video'), status enum('pending','accepted','rejected','ended'), startedAt, endedAt, durationSeconds, signalingData JSON, endedReason

Notes:
- Use integer primary keys (bigint) or UUIDs depending on scale.
- Add appropriate indexes for pagination and unread-count queries.

## 4) API Architecture

- Keep RESTful endpoints thin and protected by auth middleware.
- Controllers should call services which call repositories.

Suggested endpoints:
- `POST /api/auth/login`, `POST /api/auth/register`, `POST /api/auth/refresh`
- `GET /api/chats?limit=&cursor=` — list chats
- `GET /api/chats/:id/messages?limit=&cursor=` — paginated messages
- `POST /api/chats/:id/messages` — send message (persist + emit via service)
- `PATCH /api/messages/:id/status` — update status (seen/delivered)
- `POST /api/calls` — start call (fallback HTTP for webhooks/compat)
- `GET /api/users/:id/presence` — presence info

All APIs should:
- validate inputs (validators/JOI or celebrate)
- use pagination with cursor-based tokens
- return minimal payloads and include `clientMsgId` when supporting optimistic UI

## 5) WebRTC Signaling Flow

- Use socket events for all signaling (do NOT transport offers via HTTP):
  - Caller: `call:request` (payload: { chatId, targetUserId, clientCallId, offer, type })
  - Server: create `calls` record with `pending` status, emit `call:incoming` to callee(s)
  - Callee: `call:answer` (payload: { callId, answer }) -> server updates record and emits `call:accepted` to caller
  - Both sides: exchange ICE via `call:ice` events with `callId` and `candidate`
  - End: `call:end` updates record, log duration

- Reconnects:
  - If peer disconnects, maintain call record with `lastSeen` and allow short reconnect window (e.g., 30s) to rejoin by socket re-registration.

- Signaling reliability:
  - ACKs on critical events using callback/ack pattern.
  - Persist offers/answers in call record until call ends.

## 6) Security Improvements

- Authentication:
  - JWT for REST + sockets (already present). Add token expiry and refresh tokens.
- Socket hardening:
  - Verify JWT on connect, map socket to user, and validate scopes/claims.
  - Limit event rate per socket per event type.
- Input validation:
  - Sanitize content (XSS) and validate media payloads.
- Cookies & CSRF:
  - Use secure, httpOnly cookies for refresh tokens if using cookie flows.
- Transport security:
  - Enforce TLS/HTTPS in production.

## 7) Scalability Plan

- Socket clustering: use Redis adapter to broadcast between nodes.
- Presence: store user→socket mapping in Redis sets for global presence.
- Background jobs: use a queued worker system (BullMQ/Redis) for heavy tasks (push notifications, media transcoding).
- Media storage: S3 (or Cloudinary) with presigned URLs; store media meta in DB.
- DB scaling: use read replicas for heavy read queries, paginate strictly and add indexes.

## 8) Reliability Improvements

- Retries & ACKs: implement ack-based flows for critical events (message persisted, delivery ack).
- Heartbeat & ping: rely on socket.io heartbeat; also implement application-level keepalive for active calls.
- Graceful shutdown: close socket server, stop accepting new connections, flush pending tasks, wait for workers.
- Monitoring: instrument events with traces, expose metrics (Prometheus) and error logs.

## 9) Migration Strategy (non-breaking)

1. Add `SocketManager` and presence service as new modules; do not remove current `socket/index.js` yet.
2. Incrementally refactor event handlers to use `services/` and `repositories/`.
3. Add Redis adapter and enable it behind a feature flag.
4. Migrate message persistence to `messageService` that returns stable acknowledgements (with `clientMsgId`).

## 10) Next Steps — actionable tasks I can implement now

- Add `SocketManager` scaffold and `presenceService` (non-breaking) so we can start migrating events one-by-one.
- Add Redis config file and optional adapter wiring behind env flag.
- Create `services/messageService.js` and `services/callService.js` stubs to centralize logic.

If you'd like, I can now create the scaffolding files and implement the `SocketManager` and `presenceService` (safe, additive changes). Which should I do first: `SocketManager` + presence, or `messageService` + callService` stubs?