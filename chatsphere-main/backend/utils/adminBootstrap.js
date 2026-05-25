import bcrypt from 'bcryptjs';
import { DataTypes } from 'sequelize';
import { sequelize, User } from '../models/index.js';

const ADMIN_EMAIL = 'admin@chatapp.com';
const ADMIN_PASSWORD = 'Admin@123';
const ADMIN_FULL_NAME = 'ChatSphere Admin';
const ADMIN_USERNAME = 'admin';
const ADMIN_PHONE = '+10000000000';
const ACCOUNT_STATUSES = ['pending', 'approved', 'rejected', 'blocked'];

const getTableName = () => {
  const tableName = User.getTableName();
  if (typeof tableName === 'string') return tableName;
  return tableName?.tableName || tableName?.name || 'Users';
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
    await queryInterface.addColumn(tableName, columnName, definition);
    return;
  }

  await queryInterface.changeColumn(tableName, columnName, definition);
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

  return admin;
};
