const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const buildConfig = () => {
  const connectionUrl = process.env.DATABASE_URL || process.env.MYSQL_URL;
  const base = {
    dialect: 'mysql',
    logging: false,
    timezone: '+00:00'
  };

  if ((process.env.MYSQL_SSL || '').toLowerCase() === 'true' || process.env.NODE_ENV === 'production') {
    base.dialectOptions = {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    };
  }

  if (connectionUrl) {
    return {
      url: connectionUrl,
      ...base
    };
  }

  return {
    username: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DB || 'chatsphere',
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: Number(process.env.MYSQL_PORT || 3306),
    ...base
  };
};

module.exports = {
  development: buildConfig(),
  test: buildConfig(),
  production: buildConfig()
};
