import 'dotenv/config';
import { Sequelize } from 'sequelize';
import sequelize from '../config/db.js';

const TABLE_NAME = 'users';

const columnExists = async (columnName) => {
  const rows = await sequelize.query(
    `SELECT COUNT(*) AS count
     FROM information_schema.columns
     WHERE table_schema = DATABASE()
       AND table_name = :tableName
       AND column_name = :columnName`,
    {
      replacements: { tableName: TABLE_NAME, columnName },
      type: Sequelize.QueryTypes.SELECT
    }
  );

  return Number(rows?.[0]?.count || 0) > 0;
};

const addColumnIfMissing = async (columnName, definition) => {
  const exists = await columnExists(columnName);
  if (exists) return false;

  await sequelize.query(`ALTER TABLE \`${TABLE_NAME}\` ADD COLUMN ${definition}`);
  return true;
};

const run = async () => {
  await sequelize.authenticate();

  await addColumnIfMissing('status', "\`status\` VARCHAR(20) NULL DEFAULT NULL");
  await addColumnIfMissing('role', "\`role\` VARCHAR(20) NULL DEFAULT NULL");

  await sequelize.query(
    `UPDATE \`${TABLE_NAME}\`
     SET \`status\` = 'approved'
     WHERE \`status\` IS NULL
        OR LOWER(TRIM(CAST(\`status\` AS CHAR))) NOT IN ('pending', 'approved', 'blocked')`
  );

  await sequelize.query(
    `UPDATE \`${TABLE_NAME}\`
     SET \`role\` = 'user'
     WHERE \`role\` IS NULL
        OR LOWER(TRIM(CAST(\`role\` AS CHAR))) NOT IN ('user', 'admin')`
  );

  await sequelize.query(
    `ALTER TABLE \`${TABLE_NAME}\`
     MODIFY COLUMN \`status\` ENUM('pending','approved','blocked') NOT NULL DEFAULT 'pending'`
  );

  await sequelize.query(
    `ALTER TABLE \`${TABLE_NAME}\`
     MODIFY COLUMN \`role\` ENUM('user','admin') NOT NULL DEFAULT 'user'`
  );

  console.log('Admin auth migration complete');
  await sequelize.close();
};

run().catch(async (error) => {
  console.error('Admin auth migration failed', error);
  await sequelize.close();
  process.exit(1);
});
