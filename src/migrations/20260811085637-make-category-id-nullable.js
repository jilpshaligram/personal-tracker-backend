'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Force the database to allow NULL values in the category_id column
    await queryInterface.sequelize.query('ALTER TABLE "transactions" ALTER COLUMN "category_id" DROP NOT NULL;');
  },

  async down(queryInterface, Sequelize) {
    // Revert back to NOT NULL if needed (not recommended since transfers don't have categories)
    await queryInterface.sequelize.query('ALTER TABLE "transactions" ALTER COLUMN "category_id" SET NOT NULL;');
  }
};
