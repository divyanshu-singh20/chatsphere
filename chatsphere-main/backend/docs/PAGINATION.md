# Pagination Strategy

Messages timeline:
- Use cursor-based pagination with `createdAt`+`id` as cursor.
- Backend returns `items` (ordered ascending for client) and `nextCursor` (oldest message returned).

Chats list:
- Cursor-based by `updatedAt` or `lastMessageAt` to surface recent activity.

API contract example:
- Request: `GET /api/chats/:id/messages?limit=50&before=2026-05-20T10:00:00Z__12345`
- Response: `{ items: [...], cursor: '2026-05-20T09:40:00Z__12200' }`

Client-side behavior:
- Load newest N messages on open, then prepend older pages when scrolling up.
- Use virtualization to render long lists.
