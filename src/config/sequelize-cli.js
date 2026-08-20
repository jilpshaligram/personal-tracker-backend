const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const dbPassword = process.env.DB_PASSWORD ? process.env.DB_PASSWORD.replace(/^'|'$/g, "") : '';

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: dbPassword,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    dialectOptions: {
      useUTC: false,
    },
    timezone: '+05:30'
  },
  test: {
    username: process.env.DB_USER,
    password: dbPassword,
    database: `${process.env.DB_NAME}_test`,
    host: process.env.DB_HOST,
    dialect: 'postgres',
  },
  production: {
    username: process.env.DB_USER,
    password: dbPassword,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: 'postgres',
  }
};
