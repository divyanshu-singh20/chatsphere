'use strict';

const { DataTypes } = require('sequelize');

const TABLE_NAME = 'users';

const hasUsersTable = async (queryInterface) => {
  const tables = await queryInterface.showAllTables();
  return tables.some((table) => {
    if (typeof table === 'string') return table === TABLE_NAME;
    return table?.tableName === TABLE_NAME || table?.name === TABLE_NAME;
  });
};

const columnExists = async (queryInterface, columnName) => {
  const tableInfo = await queryInterface.describeTable(TABLE_NAME);
  return Object.prototype.hasOwnProperty.call(tableInfo, columnName);
};

const addColumnIfMissing = async (queryInterface, columnName, definition) => {
  const exists = await columnExists(queryInterface, columnName);
  if (exists) return false;

  await queryInterface.addColumn(TABLE_NAME, columnName, definition);
  return true;
};

module.exports = {
  async up(queryInterface) {
    if (!(await hasUsersTable(queryInterface))) {
      return;
    }

    await addColumnIfMissing(queryInterface, 'status', {
      type: DataTypes.ENUM('pending', 'approved', 'blocked'),
      allowNull: true,
      defaultValue: null
    });

    await addColumnIfMissing(queryInterface, 'role', {
      type: DataTypes.ENUM('user', 'admin'),
      allowNull: true,
      defaultValue: null
    });

     await queryInterface.sequelize.query(
      `UPDATE \`${TABLE_NAME}\`
       SET \`status\` = 'approved'
       WHERE \`status\` IS NULL
         OR LOWER(TRIM(CAST(\`status\` AS CHAR))) NOT IN ('pending', 'approved', 'blocked')`
     );

    await queryInterface.sequelize.query(
      `UPDATE \`${TABLE_NAME}\`
       SET \`role\` = 'user'
       WHERE \`role\` IS NULL
         OR LOWER(TRIM(CAST(\`role\` AS CHAR))) NOT IN ('user', 'admin')`
    );

    await queryInterface.changeColumn(TABLE_NAME, 'status', {
      type: DataTypes.ENUM('pending', 'approved', 'blocked'),
      allowNull: false,
      defaultValue: 'pending'
    });

    await queryInterface.changeColumn(TABLE_NAME, 'role', {
      type: DataTypes.ENUM('user', 'admin'),
      allowNull: false,
      defaultValue: 'user'
    });
  },

  async down(queryInterface) {
    if (!(await hasUsersTable(queryInterface))) {
      return;
    }

    const hasStatus = await columnExists(queryInterface, 'status');
    const hasRole = await columnExists(queryInterface, 'role');

    if (hasStatus) {
      await queryInterface.changeColumn(TABLE_NAME, 'status', {
        type: DataTypes.STRING(120),
        allowNull: false,
        defaultValue: 'Hey there! I am using ChatSphere.'
      });
    }

    if (hasRole) {
      await queryInterface.changeColumn(TABLE_NAME, 'role', {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'user'
      });
    }
  }
};
