'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('documents').catch(() => null);
    if (tableInfo) {
      if (!tableInfo.deletedAt) {
        await queryInterface.addColumn('documents', 'deletedAt', {
          type: Sequelize.DATE,
          allowNull: true,
        });
      }
      if (!tableInfo.fileResourceType) {
        await queryInterface.addColumn('documents', 'fileResourceType', {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: 'raw',
        });
      }
    }
  },

  async down(queryInterface) {
    const tableInfo = await queryInterface.describeTable('documents').catch(() => null);
    if (tableInfo) {
      if (tableInfo.deletedAt) {
        await queryInterface.removeColumn('documents', 'deletedAt');
      }
      if (tableInfo.fileResourceType) {
        await queryInterface.removeColumn('documents', 'fileResourceType');
      }
    }
  },
};
