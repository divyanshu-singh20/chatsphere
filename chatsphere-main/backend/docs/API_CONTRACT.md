# API Contract — ChatSphere

All responses follow the standard envelope.

Success:
{
  "success": true,
  "data": { ... },
  "message": "Optional human message"
}

Error:
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}

Authentication: JWT in `Authorization: Bearer <token>` header. Refresh tokens via secure HttpOnly cookie `refresh_token`.

---

## Auth

POST /api/auth/register
Body: { username, email, password }
Response: { success: true, data: { user, token, refreshToken } }

POST /api/auth/login
Body: { usernameOrEmail, password }
Response: { success: true, data: { user, token, refreshToken } }

POST /api/auth/refresh
Body: {}
Cookie: refresh_token
Response: { success: true, data: { token } }

POST /api/auth/logout
Body: {}
Clears refresh cookie

---

## Users

GET /api/users/:id
Response: { success: true, data: { id, username, avatar, bio, lastSeenAt, isOnline } }

PATCH /api/users/:id
Body: { avatar?, bio?, displayName? }
Response: { success: true, data: { user } }

GET /api/users?search=foo&limit=20
Response: { success: true, data: { items: [], cursor: null } }

---

## Chats

POST /api/chats
Body: { type: 'private'|'group', participantIds: [ids], title?, avatar? }
Response: { success: true, data: { chat } }

GET /api/chats?limit=20&cursor=<cursor>
Response: { success: true, data: { items: [ { chat, lastMessage, unreadCount } ], cursor: '<nextCursor>' } }

GET /api/chats/:id
Response: { success: true, data: { chat } }

PATCH /api/chats/:id/archive
PATCH /api/chats/:id/pin

---

## Messages

GET /api/chats/:id/messages?limit=50&before=<ISO|cursor>
Response: { success: true, data: { items: [ messages... ], cursor: '<nextCursor>' } }

POST /api/chats/:id/messages
Body: { clientMsgId?, type, content?, mediaUrl?, replyToMessageId? }
Response: { success: true, data: { messageId, clientMsgId, createdAt } }

PATCH /api/messages/:id
Body: { content } // edit

DELETE /api/messages/:id
Response: success

POST /api/messages/:id/react
Body: { emoji }

POST /api/messages/status
Body: { messageId, status: 'delivered'|'seen', forUserId? }
Response: success

---

## Calls

GET /api/calls/history?limit=50&cursor=
Response: { success: true, data: { items: [call records], cursor } }

GET /api/calls/missed
Response: { success: true, data: { items: [call records] } }

POST /api/calls/:id/end
Body: { reason? }

---

## Webhooks / Push

POST /api/notifications/push
Body: { userId, payload }

---

Validation: use validators for every endpoint. Return `400` with error envelope when invalid.
