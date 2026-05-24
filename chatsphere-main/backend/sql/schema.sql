CREATE TABLE users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name VARCHAR(150) NOT NULL,
  username VARCHAR(80) NOT NULL UNIQUE,
  email VARCHAR(191) NOT NULL UNIQUE,
  phone_number VARCHAR(30) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  avatar LONGTEXT NULL,
  bio TEXT NULL,
  about TEXT NULL,
  status ENUM('pending', 'approved', 'blocked') NOT NULL DEFAULT 'pending',
  role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  last_seen_at DATETIME NULL,
  is_online TINYINT(1) DEFAULT 0,
  remember_token VARCHAR(255) NULL,
  is_deleted TINYINT(1) DEFAULT 0,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  deleted_at DATETIME NULL,
  PRIMARY KEY (id)
);

CREATE TABLE chats (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  avatar LONGTEXT NULL,
  is_group TINYINT(1) DEFAULT 0,
  description TEXT NULL,
  created_by_id BIGINT UNSIGNED NOT NULL,
  last_message_at DATETIME NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  FOREIGN KEY (created_by_id) REFERENCES users(id)
);

CREATE TABLE `ChatMembers` (
  chat_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  PRIMARY KEY (chat_id, user_id),
  FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE messages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  chat_id BIGINT UNSIGNED NOT NULL,
  sender_id BIGINT UNSIGNED NOT NULL,
  content LONGTEXT NULL,
  media_url LONGTEXT NULL,
  media_type ENUM('text','image','video','audio','pdf','file') DEFAULT 'text',
  reply_to_id BIGINT UNSIGNED NULL,
  edited_at DATETIME NULL,
  deleted_at DATETIME NULL,
  seen_at DATETIME NULL,
  deleted_for_everyone TINYINT(1) DEFAULT 0,
  is_pinned TINYINT(1) DEFAULT 0,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id),
  FOREIGN KEY (reply_to_id) REFERENCES messages(id)
);

CREATE TABLE groups (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  chat_id BIGINT UNSIGNED NOT NULL UNIQUE,
  admin_id BIGINT UNSIGNED NOT NULL,
  icon LONGTEXT NULL,
  rules TEXT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
  FOREIGN KEY (admin_id) REFERENCES users(id)
);

CREATE TABLE group_members (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  role ENUM('admin','member') DEFAULT 'member',
  group_id BIGINT UNSIGNED NULL,
  user_id BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE notifications (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  type VARCHAR(60) NOT NULL,
  title VARCHAR(191) NOT NULL,
  body TEXT NULL,
  is_read TINYINT(1) DEFAULT 0,
  meta JSON NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE calls (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  chat_id BIGINT UNSIGNED NULL,
  caller_id BIGINT UNSIGNED NOT NULL,
  callee_id BIGINT UNSIGNED NOT NULL,
  type ENUM('voice','video') NOT NULL,
  status ENUM('ringing','accepted','rejected','ended') DEFAULT 'ringing',
  started_at DATETIME NULL,
  ended_at DATETIME NULL,
  signaling_data JSON NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE SET NULL,
  FOREIGN KEY (caller_id) REFERENCES users(id),
  FOREIGN KEY (callee_id) REFERENCES users(id)
);

CREATE TABLE blocked_users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  blocker_id BIGINT UNSIGNED NULL,
  blocked_id BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  FOREIGN KEY (blocker_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (blocked_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE message_reactions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  message_id BIGINT UNSIGNED NULL,
  user_id BIGINT UNSIGNED NULL,
  emoji VARCHAR(50) NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE starred_messages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  message_id BIGINT UNSIGNED NULL,
  user_id BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
