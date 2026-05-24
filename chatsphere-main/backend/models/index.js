// import { DataTypes, Op } from 'sequelize';
// import sequelize from '../config/db.js';

// const User = sequelize.define('User', {
//   id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
//   fullName: { type: DataTypes.STRING(150), allowNull: false },
//   username: { type: DataTypes.STRING(80), allowNull: false, unique: true },
//   email: { type: DataTypes.STRING(191), allowNull: false, unique: true, validate: { isEmail: true } },
//   phoneNumber: { type: DataTypes.STRING(30), allowNull: false, unique: true },
//   password: { type: DataTypes.STRING(255), allowNull: false },
//   avatar: { type: DataTypes.TEXT('long') },
//   bio: { type: DataTypes.TEXT },
//   about: { type: DataTypes.TEXT },
//   status: { type: DataTypes.STRING(120), defaultValue: 'Hey there! I am using ChatSphere.' },
//   lastSeenAt: { type: DataTypes.DATE },
//   isOnline: { type: DataTypes.BOOLEAN, defaultValue: false },
//   rememberToken: { type: DataTypes.STRING(255) },
//   isDeleted: { type: DataTypes.BOOLEAN, defaultValue: false }
// }, { paranoid: true });

// const Chat = sequelize.define('Chat', {
//   id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
//   name: { type: DataTypes.STRING(150), allowNull: false },
//   avatar: { type: DataTypes.TEXT('long') },
//   isGroup: { type: DataTypes.BOOLEAN, defaultValue: false },
//   description: { type: DataTypes.TEXT },
//   createdById: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
//   lastMessageAt: { type: DataTypes.DATE }
// });

// const Message = sequelize.define('Message', {
//   id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
//   content: { type: DataTypes.TEXT('long') },
//   mediaUrl: { type: DataTypes.TEXT('long') },
//   mediaType: { type: DataTypes.ENUM('text', 'image', 'video', 'audio', 'pdf', 'file'), defaultValue: 'text' },
//   replyToId: { type: DataTypes.BIGINT.UNSIGNED },
//   editedAt: { type: DataTypes.DATE },
//   deletedAt: { type: DataTypes.DATE },
//   seenAt: { type: DataTypes.DATE },
//   deletedForEveryone: { type: DataTypes.BOOLEAN, defaultValue: false },
//   isPinned: { type: DataTypes.BOOLEAN, defaultValue: false }
// });

// const Group = sequelize.define('Group', {
//   id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
//   chatId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, unique: true },
//   adminId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
//   icon: { type: DataTypes.TEXT('long') },
//   rules: { type: DataTypes.TEXT }
// });

// const GroupMember = sequelize.define('GroupMember', {
//   id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
//   role: { type: DataTypes.ENUM('admin', 'member'), defaultValue: 'member' }
// });

// const ChatMember = sequelize.define('ChatMember', {
//   userId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, primaryKey: true },
//   chatId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, primaryKey: true }
// }, {
//   tableName: 'ChatMembers'
// });

// const Notification = sequelize.define('Notification', {
//   id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
//   type: { type: DataTypes.STRING(60), allowNull: false },
//   title: { type: DataTypes.STRING(191), allowNull: false },
//   body: { type: DataTypes.TEXT },
//   isRead: { type: DataTypes.BOOLEAN, defaultValue: false },
//   meta: { type: DataTypes.JSON }
// });

// const Call = sequelize.define('Call', {
//   id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
//   type: { type: DataTypes.ENUM('voice', 'video'), allowNull: false },
//   status: { type: DataTypes.ENUM('ringing', 'accepted', 'rejected', 'ended'), defaultValue: 'ringing' },
//   startedAt: { type: DataTypes.DATE },
//   endedAt: { type: DataTypes.DATE },
//   signalingData: { type: DataTypes.JSON }
// });

// const BlockedUser = sequelize.define('BlockedUser', {
//   id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true }
// });

// const MessageReaction = sequelize.define('MessageReaction', {
//   id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
//   emoji: { type: DataTypes.STRING(50), allowNull: false }
// });

// const StarredMessage = sequelize.define('StarredMessage', {
//   id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true }
// });

// // Associations
// User.hasMany(Message, { foreignKey: 'senderId', as: 'messages' });
// Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });

// Chat.hasMany(Message, { foreignKey: 'chatId', as: 'messages', onDelete: 'CASCADE' });
// Message.belongsTo(Chat, { foreignKey: 'chatId', as: 'chat' });

// User.hasMany(Chat, { foreignKey: 'createdById', as: 'createdChats' });
// Chat.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });

// User.belongsToMany(Chat, { through: ChatMember, as: 'chats', foreignKey: 'userId', otherKey: 'chatId' });
// Chat.belongsToMany(User, { through: ChatMember, as: 'members', foreignKey: 'chatId', otherKey: 'userId' });

// Chat.hasOne(Group, { foreignKey: 'chatId', as: 'group' });
// Group.belongsTo(Chat, { foreignKey: 'chatId', as: 'chat' });
// Group.belongsTo(User, { foreignKey: 'adminId', as: 'admin' });
// User.belongsToMany(Group, { through: GroupMember, as: 'groups', foreignKey: 'userId' });
// Group.belongsToMany(User, { through: GroupMember, as: 'members', foreignKey: 'groupId' });

// User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
// Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User.hasMany(Call, { foreignKey: 'callerId', as: 'callsMade' });
// User.hasMany(Call, { foreignKey: 'calleeId', as: 'callsReceived' });
// Call.belongsTo(User, { foreignKey: 'callerId', as: 'caller' });
// Call.belongsTo(User, { foreignKey: 'calleeId', as: 'callee' });
// Chat.hasMany(Call, { foreignKey: 'chatId', as: 'calls' });
// Call.belongsTo(Chat, { foreignKey: 'chatId', as: 'chat' });

// User.belongsToMany(User, { through: BlockedUser, as: 'blockedUsers', foreignKey: 'blockerId', otherKey: 'blockedId' });

// Message.belongsToMany(User, { through: MessageReaction, as: 'reactors', foreignKey: 'messageId', otherKey: 'userId' });
// User.belongsToMany(Message, { through: MessageReaction, as: 'reactedMessages', foreignKey: 'userId', otherKey: 'messageId' });

// User.belongsToMany(Message, { through: StarredMessage, as: 'starredMessages', foreignKey: 'userId', otherKey: 'messageId' });
// Message.belongsToMany(User, { through: StarredMessage, as: 'starredBy', foreignKey: 'messageId', otherKey: 'userId' });

// Message.belongsTo(Message, { foreignKey: 'replyToId', as: 'replyTo' });

// export { sequelize, User, Chat, Message, Group, GroupMember, ChatMember, Notification, Call, BlockedUser, MessageReaction, StarredMessage, Op };


import { DataTypes, Op } from 'sequelize';
import sequelize from '../config/db.js';

const ACCOUNT_STATUSES = ['pending', 'approved', 'blocked'];
const USER_ROLES = ['user', 'admin'];

const User = sequelize.define('User', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },

  fullName: {
    type: DataTypes.STRING(150),
    allowNull: false
  },

  username: {
    type: DataTypes.STRING(80),
    allowNull: false,
    unique: true
  },

  email: {
    type: DataTypes.STRING(191),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },

  phoneNumber: {
    type: DataTypes.STRING(30),
    allowNull: false,
    unique: true
  },

  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },

  avatar: {
    type: DataTypes.TEXT('long')
  },

  bio: {
    type: DataTypes.TEXT
  },

  about: {
    type: DataTypes.TEXT
  },

  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'pending'
  },

  role: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'user',
    validate: {
      isIn: [USER_ROLES]
    }
  },

  lastSeenAt: {
    type: DataTypes.DATE
  },

  isOnline: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },

  rememberToken: {
    type: DataTypes.STRING(255)
  },

  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }

}, {
  paranoid: true
});

const Chat = sequelize.define('Chat', {

  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },

  name: {
    type: DataTypes.STRING(150),
    allowNull: false
  },

  avatar: {
    type: DataTypes.TEXT('long')
  },

  isGroup: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },

  description: {
    type: DataTypes.TEXT
  },

  createdById: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false
  },

  lastMessageAt: {
    type: DataTypes.DATE
  }

});

const Message = sequelize.define('Message', {

  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },

  content: {
    type: DataTypes.TEXT('long')
  },

  mediaUrl: {
    type: DataTypes.TEXT('long')
  },

  mediaType: {
    type: DataTypes.ENUM('text', 'image', 'video', 'audio', 'pdf', 'file'),
    defaultValue: 'text'
  },

  replyToId: {
    type: DataTypes.BIGINT.UNSIGNED
  },

  editedAt: {
    type: DataTypes.DATE
  },

  seenAt: {
    type: DataTypes.DATE
  },

  deletedForEveryone: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },

  isPinned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }

}, {
  paranoid: true,

  indexes: [
    { fields: ['chatId'] },
    { fields: ['senderId'] },
    { fields: ['createdAt'] }
  ]
});

const Group = sequelize.define('Group', {

  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },

  chatId: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    unique: true
  },

  adminId: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false
  },

  icon: {
    type: DataTypes.TEXT('long')
  },

  rules: {
    type: DataTypes.TEXT
  }

});

const GroupMember = sequelize.define('GroupMember', {

  userId: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true
  },

  groupId: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true
  },

  role: {
    type: DataTypes.ENUM('admin', 'member'),
    defaultValue: 'member'
  }

});

const ChatMember = sequelize.define('ChatMember', {

  userId: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    primaryKey: true
  },

  chatId: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    primaryKey: true
  }

}, {
  tableName: 'ChatMembers'
});

const Notification = sequelize.define('Notification', {

  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },

  type: {
    type: DataTypes.STRING(60),
    allowNull: false
  },

  title: {
    type: DataTypes.STRING(191),
    allowNull: false
  },

  body: {
    type: DataTypes.TEXT
  },

  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },

  meta: {
    type: DataTypes.JSON
  }

});

const Call = sequelize.define('Call', {

  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },

  chatId: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true
  },

  callerId: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false
  },

  calleeId: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false
  },

  type: {
    type: DataTypes.ENUM('voice', 'video'),
    allowNull: false
  },

  status: {
    type: DataTypes.ENUM('ringing', 'accepted', 'rejected', 'ended'),
    defaultValue: 'ringing'
  },

  startedAt: {
    type: DataTypes.DATE
  },

  endedAt: {
    type: DataTypes.DATE
  },

  signalingData: {
    type: DataTypes.JSON
  }

});

const BlockedUser = sequelize.define('BlockedUser', {

  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  }

});

const MessageReaction = sequelize.define('MessageReaction', {

  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },

  emoji: {
    type: DataTypes.STRING(50),
    allowNull: false
  }

});

const StarredMessage = sequelize.define('StarredMessage', {

  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  }

});

const MessageStatus = sequelize.define('MessageStatus', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  messageId: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false
  },
  userId: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false
  },
  deliveredAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  seenAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  indexes: [
    { unique: true, fields: ['messageId', 'userId'] },
    { fields: ['userId'] }
  ]
});

// ================= ASSOCIATIONS =================

// Messages
User.hasMany(Message, {
  foreignKey: 'senderId',
  as: 'messages'
});

Message.belongsTo(User, {
  foreignKey: 'senderId',
  as: 'sender'
});

// Chats
Chat.hasMany(Message, {
  foreignKey: 'chatId',
  as: 'messages',
  onDelete: 'CASCADE'
});

Message.belongsTo(Chat, {
  foreignKey: 'chatId',
  as: 'chat'
});

// Chat Creator
User.hasMany(Chat, {
  foreignKey: 'createdById',
  as: 'createdChats'
});

Chat.belongsTo(User, {
  foreignKey: 'createdById',
  as: 'createdBy'
});

// Chat Members
User.belongsToMany(Chat, {
  through: ChatMember,
  as: 'chats',
  foreignKey: 'userId',
  otherKey: 'chatId'
});

Chat.belongsToMany(User, {
  through: ChatMember,
  as: 'members',
  foreignKey: 'chatId',
  otherKey: 'userId'
});

// Groups
Chat.hasOne(Group, {
  foreignKey: 'chatId',
  as: 'group'
});

Group.belongsTo(Chat, {
  foreignKey: 'chatId',
  as: 'chat'
});

Group.belongsTo(User, {
  foreignKey: 'adminId',
  as: 'admin'
});

User.belongsToMany(Group, {
  through: GroupMember,
  as: 'groups',
  foreignKey: 'userId'
});

Group.belongsToMany(User, {
  through: GroupMember,
  as: 'members',
  foreignKey: 'groupId'
});

// Notifications
User.hasMany(Notification, {
  foreignKey: 'userId',
  as: 'notifications'
});

Notification.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// Calls
User.hasMany(Call, {
  foreignKey: 'callerId',
  as: 'callsMade'
});

User.hasMany(Call, {
  foreignKey: 'calleeId',
  as: 'callsReceived'
});

Call.belongsTo(User, {
  foreignKey: 'callerId',
  as: 'caller'
});

Call.belongsTo(User, {
  foreignKey: 'calleeId',
  as: 'callee'
});

Chat.hasMany(Call, {
  foreignKey: 'chatId',
  as: 'calls'
});

Call.belongsTo(Chat, {
  foreignKey: 'chatId',
  as: 'chat'
});

// Blocked Users
User.belongsToMany(User, {
  through: BlockedUser,
  as: 'blockedUsers',
  foreignKey: 'blockerId',
  otherKey: 'blockedId'
});

// Message Reactions
Message.belongsToMany(User, {
  through: MessageReaction,
  as: 'reactors',
  foreignKey: 'messageId',
  otherKey: 'userId'
});

User.belongsToMany(Message, {
  through: MessageReaction,
  as: 'reactedMessages',
  foreignKey: 'userId',
  otherKey: 'messageId'
});

// Starred Messages
User.belongsToMany(Message, {
  through: StarredMessage,
  as: 'starredMessages',
  foreignKey: 'userId',
  otherKey: 'messageId'
});

Message.belongsToMany(User, {
  through: StarredMessage,
  as: 'starredBy',
  foreignKey: 'messageId',
  otherKey: 'userId'
});

// Reply Message
Message.belongsTo(Message, {
  foreignKey: 'replyToId',
  as: 'replyTo'
});

// MessageStatus associations
Message.hasMany(MessageStatus, {
  foreignKey: 'messageId',
  as: 'statuses',
  onDelete: 'CASCADE'
});

MessageStatus.belongsTo(Message, {
  foreignKey: 'messageId',
  as: 'message'
});

User.hasMany(MessageStatus, {
  foreignKey: 'userId',
  as: 'messageStatuses'
});

MessageStatus.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

export {
  sequelize,
  User,
  Chat,
  Message,
  Group,
  GroupMember,
  ChatMember,
  Notification,
  Call,
  BlockedUser,
  MessageReaction,
  StarredMessage,
  MessageStatus,
  Op
};