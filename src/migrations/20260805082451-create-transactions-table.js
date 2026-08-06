'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * TRANSACTION MODULE: `transactions` table migration
     * 
     * ENUM CREATION:
     * We explicitly create the ENUM type first because Sequelize handles ENUMs
     * natively in PostgreSQL. If the type already exists, we suppress the error
     * so migrations remain idempotent.
     */
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE payment_method AS ENUM (
          'CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'UPI', 'WALLET', 'CHEQUE'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create the transactions table
    await queryInterface.createTable('transactions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        allowNull: false,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users', // Must match the users table name exactly
          key: 'id',
        },
        onDelete: 'CASCADE', // If a user is deleted, delete their transactions
        onUpdate: 'CASCADE',
      },
      category_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'categories', // Must match the categories table name exactly
          key: 'id',
        },
        onDelete: 'RESTRICT', // Prevent deleting a category if it has transactions
        onUpdate: 'CASCADE',
      },
      amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
      },
      transaction_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      payment_method: {
        type: Sequelize.ENUM(
          'CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'UPI', 'WALLET', 'CHEQUE'
        ),
        allowNull: false,
      },
      note: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    /**
     * CONSTRAINTS:
     * Add database-level CHECK constraint to enforce positive amounts.
     * Prevents negative entries regardless of application-level bugs.
     */
    await queryInterface.addConstraint('transactions', {
      fields: ['amount'],
      type: 'check',
      where: {
        amount: {
          [Sequelize.Op.gt]: 0
        }
      },
      name: 'chk_transactions_amount_positive'
    });

    /**
     * PARTIAL INDEXES:
     * Optimizes queries by entirely excluding soft-deleted rows from the index.
     */
    await queryInterface.addIndex('transactions', ['user_id', 'transaction_date'], {
      name: 'idx_transactions_user_date',
      where: { deleted_at: null },
    });

    await queryInterface.addIndex('transactions', ['category_id'], {
      name: 'idx_transactions_category',
      where: { deleted_at: null },
    });

    await queryInterface.addIndex('transactions', ['user_id', 'created_at'], {
      name: 'idx_transactions_user_created',
      where: { deleted_at: null },
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop table first (removes constraints and indexes automatically)
    await queryInterface.dropTable('transactions');
    
    // Optionally drop the enum type if no other table uses it
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS payment_method;');
  },
};
