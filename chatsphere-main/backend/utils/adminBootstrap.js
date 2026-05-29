import bcrypt from 'bcryptjs';
import { DataTypes } from 'sequelize';
import { sequelize, Message, User } from '../models/index.js';

const ADMIN_EMAIL = 'admin@chatapp.com';
const ADMIN_PASSWORD = 'Admin@123';
const ADMIN_FULL_NAME = 'ChatSphere Admin';
const ADMIN_USERNAME = 'admin';
const ADMIN_PHONE = '+10000000000';
const LEGACY_ADMIN_EMAIL = 'admin@gmail.com';
const LEGACY_ADMIN_PASSWORD = 'admin123';
const LEGACY_ADMIN_FULL_NAME = 'ChatSphere Admin';
const LEGACY_ADMIN_USERNAME = 'admin-gmail';
const LEGACY_ADMIN_PHONE = '+10000000001';
const ACCOUNT_STATUSES = ['pending', 'approved', 'rejected', 'blocked'];

const getTableName = () => {
  const tableName = User.getTableName();
  if (typeof tableName === 'string') return tableName;
  return tableName?.tableName || tableName?.name || 'Users';
};

const getMessageTableName = () => {
  const tableName = Message.getTableName();
  if (typeof tableName === 'string') return tableName;
  return tableName?.tableName || tableName?.name || 'Messages';
};

const quoteTableName = (tableName) => `\`${String(tableName).replace(/`/g, '``')}\``;

const normalizeStatusExpression = `
  CASE
    WHEN \`status\` IS NULL THEN 'approved'
    WHEN TRIM(\`status\`) = '' THEN 'approved'
    WHEN LOWER(TRIM(\`status\`)) IN ('pending', 'approved', 'rejected', 'blocked') THEN LOWER(TRIM(\`status\`))
    ELSE 'approved'
  END
`;

const ensureColumn = async (queryInterface, tableName, columnName, definition) => {
  const table = await queryInterface.describeTable(tableName);

  if (!table[columnName]) {
    try {
      await queryInterface.addColumn(tableName, columnName, definition);
    } catch (error) {
      const duplicateColumn = [
        error?.code,
        error?.original?.code
      ].includes('ER_DUP_FIELDNAME') || [
        error?.errno,
        error?.original?.errno
      ].includes(1060);

      if (duplicateColumn) {
        return;
      }
      throw error;
    }
    return;
  }
};

export const ensureAuthSchema = async () => {
  const queryInterface = sequelize.getQueryInterface();
  const tableName = getTableName();
  const quotedTable = quoteTableName(tableName);

  await ensureColumn(queryInterface, tableName, 'role', {
    type: DataTypes.ENUM('user', 'admin'),
    allowNull: false,
    defaultValue: 'user'
  });

  await sequelize.query(
    `UPDATE ${quotedTable} SET \`role\` = 'user' WHERE \`role\` IS NULL OR \`role\` NOT IN ('user', 'admin')`
  );

  await sequelize.query(
    `UPDATE ${quotedTable} SET \`status\` = ${normalizeStatusExpression} WHERE \`status\` IS NULL OR TRIM(\`status\`) = '' OR LOWER(TRIM(\`status\`)) NOT IN ('pending', 'approved', 'rejected', 'blocked')`
  );

  await ensureColumn(queryInterface, tableName, 'status', {
    type: DataTypes.ENUM(...ACCOUNT_STATUSES),
    allowNull: false,
    defaultValue: 'pending'
  });

  await sequelize.query(
    `UPDATE ${quotedTable} SET \`status\` = 'approved' WHERE \`status\` IS NULL OR TRIM(\`status\`) = '' OR LOWER(TRIM(\`status\`)) NOT IN ('pending', 'approved', 'rejected', 'blocked')`
  );
};

export const ensureMessageSchema = async () => {
  const queryInterface = sequelize.getQueryInterface();
  const tableName = getMessageTableName();
  const quotedTable = quoteTableName(tableName);

  await ensureColumn(queryInterface, tableName, 'status', {
    type: DataTypes.ENUM('pending', 'sent', 'delivered', 'seen'),
    allowNull: false,
    defaultValue: 'sent'
  });

  await sequelize.query(
    `UPDATE ${quotedTable} SET \`status\` = 'sent' WHERE \`status\` IS NULL OR TRIM(\`status\`) = '' OR LOWER(TRIM(\`status\`)) NOT IN ('pending', 'sent', 'delivered', 'seen')`
  );

  await ensureColumn(queryInterface, tableName, 'deliveredAt', {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null
  });

  await ensureColumn(queryInterface, tableName, 'editedAt', {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null
  });

  await ensureColumn(queryInterface, tableName, 'seenAt', {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null
  });

  await ensureColumn(queryInterface, tableName, 'deletedForEveryone', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  });

  await ensureColumn(queryInterface, tableName, 'isPinned', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  });
};

export const ensureDefaultAdmin = async () => {
  const password = await bcrypt.hash(ADMIN_PASSWORD, 12);
  const [admin] = await User.findOrCreate({
    where: { email: ADMIN_EMAIL },
    defaults: {
      fullName: ADMIN_FULL_NAME,
      username: ADMIN_USERNAME,
      email: ADMIN_EMAIL,
      phoneNumber: ADMIN_PHONE,
      password,
      role: 'admin',
      status: 'approved'
    }
  });

  await admin.update({
    fullName: ADMIN_FULL_NAME,
    username: ADMIN_USERNAME,
    phoneNumber: ADMIN_PHONE,
    password,
    role: 'admin',
    status: 'approved'
  });

  const legacyPassword = await bcrypt.hash(LEGACY_ADMIN_PASSWORD, 12);
  const [legacyAdmin] = await User.findOrCreate({
    where: { email: LEGACY_ADMIN_EMAIL },
    defaults: {
      fullName: LEGACY_ADMIN_FULL_NAME,
      username: LEGACY_ADMIN_USERNAME,
      email: LEGACY_ADMIN_EMAIL,
      phoneNumber: LEGACY_ADMIN_PHONE,
      password: legacyPassword,
      role: 'admin',
      status: 'approved'
    }
  });

  await legacyAdmin.update({
    fullName: LEGACY_ADMIN_FULL_NAME,
    username: LEGACY_ADMIN_USERNAME,
    phoneNumber: LEGACY_ADMIN_PHONE,
    password: legacyPassword,
    role: 'admin',
    status: 'approved'
  });

  return admin;
};
