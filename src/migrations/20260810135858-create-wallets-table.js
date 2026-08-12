'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('wallets', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      current_balance: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
      },
      blocked_amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
      },
      currency: {
        type: Sequelize.STRING(3),
        allowNull: false,
        defaultValue: 'INR',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    // One user should have exactly one primary wallet (currently)
    await queryInterface.addIndex('wallets', ['user_id'], {
      name: 'idx_wallets_user_id',
      unique: true,
      where: { deleted_at: null },
    });

    // Ensure monetary values are never negative
    await queryInterface.sequelize.query(`
      ALTER TABLE wallets 
      ADD CONSTRAINT chk_wallets_current_balance_positive CHECK (current_balance >= 0);
    `);
    
    await queryInterface.sequelize.query(`
      ALTER TABLE wallets 
      ADD CONSTRAINT chk_wallets_blocked_amount_positive CHECK (blocked_amount >= 0);
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query('ALTER TABLE wallets DROP CONSTRAINT IF EXISTS chk_wallets_blocked_amount_positive;');
    await queryInterface.sequelize.query('ALTER TABLE wallets DROP CONSTRAINT IF EXISTS chk_wallets_current_balance_positive;');
    await queryInterface.removeIndex('wallets', 'idx_wallets_user_id');
    await queryInterface.dropTable('wallets');
  }
};
