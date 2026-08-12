'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * TRANSACTION MODULE: Alter `transactions` table migration
     * 
     * ENUM CREATION:
     */
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE transaction_type AS ENUM (
          'INCOME', 'EXPENSE', 'TRANSFER_TO_SAVING', 'TRANSFER_FROM_SAVING', 'OPENING_BALANCE'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 1. Change category_id to allow NULL
    await queryInterface.changeColumn('transactions', 'category_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'categories',
        key: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });

    // 2. Add type column
    await queryInterface.addColumn('transactions', 'type', {
      type: Sequelize.ENUM(
        'INCOME', 'EXPENSE', 'TRANSFER_TO_SAVING', 'TRANSFER_FROM_SAVING', 'OPENING_BALANCE'
      ),
      allowNull: false,
    });

    // 3. Add wallet_id column
    // The user requested to wait for Wallet creation before adding an FK.
    await queryInterface.addColumn('transactions', 'wallet_id', {
      type: Sequelize.UUID,
      allowNull: false,
    });

    // 4. Add saving_goal_id column
    await queryInterface.addColumn('transactions', 'saving_goal_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'saving_goals', // Must match saving_goals table
        key: 'id',
      },
      onDelete: 'RESTRICT', // Don't allow deleting a saving goal if it has transactions
      onUpdate: 'CASCADE',
    });

    // 5. Add indexes
    await queryInterface.addIndex('transactions', ['wallet_id', 'transaction_date'], {
      name: 'idx_transactions_wallet_date',
      where: { deleted_at: null },
    });

    await queryInterface.addIndex('transactions', ['saving_goal_id'], {
      name: 'idx_transactions_saving_goal',
      where: { deleted_at: null },
    });

    await queryInterface.addIndex('transactions', ['user_id', 'type', 'transaction_date'], {
      name: 'idx_transactions_user_type_date',
      where: { deleted_at: null },
    });
  },

  async down(queryInterface, Sequelize) {
    // Reverse operations
    await queryInterface.removeIndex('transactions', 'idx_transactions_user_type_date');
    await queryInterface.removeIndex('transactions', 'idx_transactions_saving_goal');
    await queryInterface.removeIndex('transactions', 'idx_transactions_wallet_date');
    
    await queryInterface.removeColumn('transactions', 'saving_goal_id');
    await queryInterface.removeColumn('transactions', 'wallet_id');
    await queryInterface.removeColumn('transactions', 'type');

    await queryInterface.changeColumn('transactions', 'category_id', {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'categories',
        key: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });

    await queryInterface.sequelize.query('DROP TYPE IF EXISTS transaction_type;');
  }
};
