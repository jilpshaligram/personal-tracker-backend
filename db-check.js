const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const { Sequelize } = require('sequelize');

const dbPassword = process.env.DB_PASSWORD ? process.env.DB_PASSWORD.replace(/^'|'$/g, "") : '';

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  dbPassword,
  {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    port: process.env.DB_PORT || 5432,
    logging: false,
  }
);

async function check() {
  try {
    await sequelize.authenticate();
    await sequelize.query(`DELETE FROM "SequelizeMeta" WHERE name IN (
      '20260805082451-create-transactions-table.js',
      '20260810000001-create-wallets-table.js',
      '20260810000002-create-saving-goals-table.js',
      '20260810000003-create-budgets-table.js',
      '20260810000004-update-transactions-table.js',
      '20260810134320-alter-transactions-table.js'
    )`);
    console.log('Cleaned up rogue migration records');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await sequelize.close();
  }
}

check();
