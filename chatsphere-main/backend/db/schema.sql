-- SQL schema for ChatSphere (designed for MySQL / MariaDB)
-- Non-destructive: run as migration scripts; do not blindly execute on production without review.

CREATE TABLE IF NOT EXISTS `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(80) NOT NULL UNIQUE,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `avatar` TEXT,
  `bio` TEXT,
  `lastSeenAt` DATETIME NULL,
  `isOnline` TINYINT(1) DEFAULT 0,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `chats` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `type` ENUM('private','group') NOT NULL DEFAULT 'private',
  `title` VARCHAR(255) NULL,
  `avatar` TEXT NULL,
  `lastMessageId` BIGINT UNSIGNED NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX (`type`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `chat_participants` (

CREATE TABLE IF NOT EXISTS `messages` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `chatId` BIGINT UNSIGNED NOT NULL,
  `senderId` BIGINT UNSIGNED NOT NULL,
  `type` ENUM('text','image','video','file','voice') NOT NULL DEFAULT 'text',
  `content` TEXT NULL,
  `mediaUrl` TEXT NULL,
  `replyToMessageId` BIGINT UNSIGNED NULL,
  `status` ENUM('pending','sent','delivered','seen') NOT NULL DEFAULT 'sent',
  `clientMsgId` VARCHAR(191) NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX (`chatId`,`createdAt`),
  INDEX (`senderId`,`createdAt`),
  FOREIGN KEY (`chatId`) REFERENCES `chats`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`senderId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`replyToMessageId`) REFERENCES `messages`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `message_status` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `messageId` BIGINT UNSIGNED NOT NULL,
  `userId` BIGINT UNSIGNED NOT NULL,
  `deliveredAt` DATETIME NULL,
  `seenAt` DATETIME NULL,
  UNIQUE KEY `message_user_unique` (`messageId`,`userId`),
  INDEX (`userId`),
  FOREIGN KEY (`messageId`) REFERENCES `messages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `calls` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `callerId` BIGINT UNSIGNED NOT NULL,
  `receiverId` BIGINT UNSIGNED NOT NULL,
  `chatId` BIGINT UNSIGNED NULL,
  `type` ENUM('audio','video') NOT NULL DEFAULT 'audio',
  `status` ENUM('pending','accepted','rejected','ended') NOT NULL DEFAULT 'pending',
  `startedAt` DATETIME NULL,
  `endedAt` DATETIME NULL,
  `durationSeconds` INT UNSIGNED NULL,
  `signalingData` JSON NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX (`callerId`),
  INDEX (`receiverId`),
  FOREIGN KEY (`callerId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  FOREIGN KEY (`receiverId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  FOREIGN KEY (`chatId`) REFERENCES `chats`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `call_participants` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `callId` BIGINT UNSIGNED NOT NULL,
  `userId` BIGINT UNSIGNED NOT NULL,
  `joinedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `leftAt` DATETIME NULL,
  INDEX (`callId`),
  INDEX (`userId`),
  FOREIGN KEY (`callId`) REFERENCES `calls`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Helpful views/aggregates
-- Unread counts per user per chat can be maintained in `chat_participants.unreadCount` and updated transactionally.
