Services

- Purpose: business logic and orchestration.
- `messageService` handles optimistic writes, persists messages, emits events via SocketManager, updates unread counts.
- `callService` manages call records, signaling persistence, and call lifecycle.

Services should depend on repositories (no direct DB calls in controllers/socket handlers).
