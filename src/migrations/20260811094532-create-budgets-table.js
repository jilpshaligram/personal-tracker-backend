'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * BUDGETS MODULE: `budgets` table migration
     * 
     * ENUM CREATION:
     */
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE enum_budgets_period AS ENUM (
          'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryInterface.createTable('budgets', {
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
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
      },
      period: {
        type: Sequelize.ENUM('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'),
        allowNull: false,
      },
      start_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      end_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
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
     */
    await queryInterface.addConstraint('budgets', {
      fields: ['amount'],
      type: 'check',
      where: {
        amount: {
          [Sequelize.Op.gt]: 0
        }
      },
      name: 'chk_budgets_amount_positive'
    });

    /**
     * INDEXES:
     */
    await queryInterface.addIndex('budgets', ['user_id', 'is_active'], {
      name: 'idx_budgets_user_active',
      where: { deleted_at: null },
    });

    await queryInterface.addIndex('budgets', ['user_id', 'start_date', 'end_date'], {
      name: 'idx_budgets_user_dates',
      where: { deleted_at: null },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('budgets');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_budgets_period;');
  }
};

