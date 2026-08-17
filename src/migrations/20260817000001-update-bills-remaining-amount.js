'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Make remainingAmount nullable
    await queryInterface.changeColumn('bills', 'remainingAmount', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
    });

    // Update existing records to set remainingAmount = amount - paidAmount where remainingAmount is null
    await queryInterface.sequelize.query(`
      UPDATE bills 
      SET "remainingAmount" = amount - COALESCE("paidAmount", 0)
      WHERE "remainingAmount" IS NULL
    `);
  },

  async down(queryInterface, Sequelize) {
    // Revert back to NOT NULL
    await queryInterface.changeColumn('bills', 'remainingAmount', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
    });
  },
};
