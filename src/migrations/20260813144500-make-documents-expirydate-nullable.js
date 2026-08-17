'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('documents').catch(() => null);
    if (tableInfo && tableInfo.expiryDate) {
      await queryInterface.changeColumn('documents', 'expiryDate', {
        type: Sequelize.DATEONLY,
        allowNull: true,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('documents').catch(() => null);
    if (tableInfo && tableInfo.expiryDate) {
      await queryInterface.changeColumn('documents', 'expiryDate', {
        type: Sequelize.DATEONLY,
        allowNull: false,
      });
    }
  },
};
