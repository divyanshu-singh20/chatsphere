# Sequelize Model Guidance

This file documents recommended Sequelize model structure mapped to the SQL schema in `db/schema.sql`.

Notes:
- Existing `models/index.js` already contains most models. Use these guidelines to add `MessageStatus` and ensure indexes/associations are present.
- Prefer `BIGINT.UNSIGNED` for primary keys for scale.

Models (summary):

- `User` — fields: `id, username, email, avatar, bio, lastSeenAt, isOnline, createdAt`.
- `Chat` — fields: `id, type, title, avatar, lastMessageId, createdAt`.
- `ChatParticipant` — `chatId, userId, role, unreadCount, joinedAt`.
- `Message` — `id, chatId, senderId, type, content, mediaUrl, replyToMessageId, status, clientMsgId, createdAt`.
- `MessageStatus` — `messageId, userId, deliveredAt, seenAt`.
- `Call` — `id, callerId, receiverId, chatId, type, status, startedAt, endedAt, durationSeconds, signalingData`.
- `CallParticipant` — `callId, userId, joinedAt, leftAt`.

Example `MessageStatus` model (ES module):

import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const MessageStatus = sequelize.define('MessageStatus', {
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  messageId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  userId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  deliveredAt: { type: DataTypes.DATE },
  seenAt: { type: DataTypes.DATE }
}, {
  indexes: [ { unique: true, fields: ['messageId','userId'] }, { fields: ['userId'] } ]
});

Associations to add:
- Message.hasMany(MessageStatus, { foreignKey: 'messageId', as: 'statuses' });
- MessageStatus.belongsTo(Message, { foreignKey: 'messageId' });
- User.hasMany(MessageStatus, { foreignKey: 'userId' });

Migration:
- Create migration for `message_status` table and add model file.
- Backfill statuses for recent messages if necessary (optional job).
