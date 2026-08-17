'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('audit_logs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'RESTRICT', // Audit logs preserved even if user is deleted
        onUpdate: 'CASCADE',
      },
      module: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      action: {
        type: Sequelize.ENUM(
          'CREATE',
          'UPDATE',
          'DELETE',
          'LOGIN',
          'LOGOUT',
          'VIEW',
          'PAYMENT',
          'EXPORT',
          'REGISTER',
          'PASSWORD_RESET',
          'MARK_READ',
          'DOWNLOAD',
          'CONTRIBUTION'
        ),
        allowNull: false,
      },
      entityId: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      entityType: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      ipAddress: {
        type: Sequelize.STRING(45),
        allowNull: false,
      },
      userAgent: {
        type: Sequelize.STRING(500),
        allowNull: false,
      },
      requestMethod: {
        type: Sequelize.STRING(10),
        allowNull: false,
      },
      requestUrl: {
        type: Sequelize.STRING(500),
        allowNull: false,
      },
      statusCode: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      changes: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    // Create indexes for query performance
    await queryInterface.addIndex('audit_logs', ['userId']);
    await queryInterface.addIndex('audit_logs', ['module']);
    await queryInterface.addIndex('audit_logs', ['action']);
    await queryInterface.addIndex('audit_logs', ['entityId']);
    await queryInterface.addIndex('audit_logs', ['createdAt']);
    await queryInterface.addIndex('audit_logs', ['userId', 'module', 'createdAt']);
  },

  async down (queryInterface, Sequelize) {
    // Drop indexes first
    await queryInterface.removeIndex('audit_logs', ['userId']);
    await queryInterface.removeIndex('audit_logs', ['module']);
    await queryInterface.removeIndex('audit_logs', ['action']);
    await queryInterface.removeIndex('audit_logs', ['entityId']);
    await queryInterface.removeIndex('audit_logs', ['createdAt']);
    await queryInterface.removeIndex('audit_logs', ['userId', 'module', 'createdAt']);
    
    // Drop the table
    await queryInterface.dropTable('audit_logs');
    
    // Drop the enum type (PostgreSQL specific)
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_audit_logs_action"');
  }
};
