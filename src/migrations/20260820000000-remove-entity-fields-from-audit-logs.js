'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Remove index on entityId if exists
    try {
      await queryInterface.removeIndex('audit_logs', ['entityId']);
    } catch {
      // Index might not exist or already removed
    }

    // Remove columns
    try {
      await queryInterface.removeColumn('audit_logs', 'entityId');
    } catch {
      // Column might already be removed
    }

    try {
      await queryInterface.removeColumn('audit_logs', 'entityType');
    } catch {
      // Column might already be removed
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('audit_logs', 'entityId', {
      type: Sequelize.UUID,
      allowNull: true,
    });

    await queryInterface.addColumn('audit_logs', 'entityType', {
      type: Sequelize.STRING(50),
      allowNull: true,
    });

    await queryInterface.addIndex('audit_logs', ['entityId']);
  },
};
