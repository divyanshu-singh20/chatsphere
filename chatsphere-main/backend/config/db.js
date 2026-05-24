// import { Sequelize } from 'sequelize';
// import path from 'path';
// import { fileURLToPath } from 'url';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// const defaultSqliteStorage = path.resolve(__dirname, '../../chatsphere.sqlite');

// const configuredDialect = (process.env.DB_DIALECT || '').toLowerCase();
// const useSqlite = configuredDialect
//   ? configuredDialect === 'sqlite'
//   : process.env.NODE_ENV !== 'production' || !process.env.MYSQL_HOST;

// const sequelize = useSqlite
//   ? new Sequelize({
//       dialect: 'sqlite',
//       storage: process.env.SQLITE_STORAGE || defaultSqliteStorage,
//       logging: false
//     })
//   : new Sequelize(
//       process.env.MYSQL_DB || 'chatsphere',
//       process.env.MYSQL_USER || 'root',
//       process.env.MYSQL_PASSWORD || '',
//       {
//         host: process.env.MYSQL_HOST,
//         port: Number(process.env.MYSQL_PORT || 3306),
//         dialect: 'mysql',
//         logging: false,
//         timezone: '+00:00'
//       }
//     );

// export default sequelize;

import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

const requireEnv = (key) => {
  const value = process.env[key];
  if (!value && isProduction) {
    throw new Error(`[db] Missing required env var: ${key}`);
  }
  return value;
};

const connectionUrl = process.env.DATABASE_URL || process.env.MYSQL_URL;
const dbName = requireEnv('MYSQL_DB') || 'chatsphere';
const dbUser = requireEnv('MYSQL_USER') || 'root';
const dbPassword = process.env.MYSQL_PASSWORD || '';
const dbHost = requireEnv('MYSQL_HOST') || '127.0.0.1';
const dbPort = Number(process.env.MYSQL_PORT || 3306);

const useSsl =
  (process.env.MYSQL_SSL || '').toLowerCase() === 'true' ||
  isProduction;

const sequelizeOptions = {
  dialect: 'mysql',
  logging: false,
  timezone: '+00:00'
};

if (useSsl) {
  sequelizeOptions.dialectOptions = {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  };
}

const sequelize = connectionUrl
  ? new Sequelize(connectionUrl, sequelizeOptions)
  : new Sequelize(dbName, dbUser, dbPassword, {
      ...sequelizeOptions,
      host: dbHost,
      port: dbPort
    });

export default sequelize;