'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX idx_unique_opening_balance 
      ON transactions (user_id) 
      WHERE type = 'OPENING_BALANCE' AND deleted_at IS NULL;
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      DROP INDEX idx_unique_opening_balance;
    `);
  }
};
