# DB Optimization & Query Strategies

1) Indexes
- `messages`:
  - composite index (`chatId`, `createdAt`) for efficient chat timeline pagination (DESC on createdAt).
  - index on `senderId` for user-specific queries.
- `chat_participants`:
  - unique(chatId,userId) and index on `userId` for retrieving user's chats.
- `message_status`:
  - unique(messageId,userId) and index on `userId`.

2) Pagination
- Use cursor-based pagination for message timelines. Cursor = `createdAt` + `id` (to handle duplicates).
  Query: SELECT ... FROM messages WHERE chatId=? AND (createdAt < cursorDate OR (createdAt = cursorDate AND id < cursorId)) ORDER BY createdAt DESC, id DESC LIMIT N

3) Unread count strategy
- Maintain `chat_participants.unreadCount` updated transactionally when new messages arrive.
- On read (message seen), decrement counters in a transaction or recalculate with `message_status` when needed.

4) Optimized queries
- Avoid N+1 by eager-loading limited associations (lastMessage, participants subset).
- Use SELECT ... FOR UPDATE when updating counters or critical state in transactions.

5) Archival & retention
- For very large installations, archive messages older than X days to a separate store (cold storage) and keep searchable metadata.

6) Connection Pooling
- Tune Sequelize pool settings: max connections per instance, use query timeouts, monitor slow queries and add missing indexes.
