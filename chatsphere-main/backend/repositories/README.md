Repositories (DB access)

- Purpose: isolate Sequelize queries and raw SQL for tests and performance tuning.
- Put complex joins, counters, and pagination in the repository layer.

Example:
 - `repositories/messageRepository.js` should provide `createMessage`, `getMessagesForChat(chatId, { limit, cursor })`, `setMessageStatus`.
