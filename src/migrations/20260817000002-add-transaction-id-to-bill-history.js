'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if table bill_history exists before adding column
    const tables = await queryInterface.showAllTables();
    if (tables.includes('bill_history')) {
      const tableDesc = await queryInterface.describeTable('bill_history');
      if (!tableDesc.transactionId) {
        await queryInterface.addColumn('bill_history', 'transactionId', {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'transactions',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        });
      }
    }
  },

  async down(queryInterface) {
    const tables = await queryInterface.showAllTables();
    if (tables.includes('bill_history')) {
      const tableDesc = await queryInterface.describeTable('bill_history');
      if (tableDesc.transactionId) {
        await queryInterface.removeColumn('bill_history', 'transactionId');
      }
    }
  },
};
