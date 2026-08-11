'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create Enums
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE "enum_saving_goals_status" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE "enum_saving_goals_reminder_frequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 2. Create Table
    await queryInterface.createTable('saving_goals', {
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
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      target_amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
      },
      saved_amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
      },
      remaining_amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
      },
      target_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      start_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_DATE'),
      },
      status: {
        type: Sequelize.ENUM('ACTIVE', 'COMPLETED', 'CANCELLED'),
        allowNull: false,
        defaultValue: 'ACTIVE',
      },
      is_completed: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      auto_reminder: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      reminder_frequency: {
        type: Sequelize.ENUM('DAILY', 'WEEKLY', 'MONTHLY'),
        allowNull: true,
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      updated_by: {
        type: Sequelize.UUID,
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

    // 3. Add Constraints
    await queryInterface.addConstraint('saving_goals', {
      fields: ['target_amount'],
      type: 'check',
      where: {
        target_amount: {
          [Sequelize.Op.gt]: 0
        }
      },
      name: 'chk_saving_goals_target_amount_positive'
    });

    await queryInterface.addConstraint('saving_goals', {
      fields: ['saved_amount'],
      type: 'check',
      where: {
        saved_amount: {
          [Sequelize.Op.gte]: 0
        }
      },
      name: 'chk_saving_goals_saved_amount_positive'
    });

    // 4. Indexes
    await queryInterface.addIndex('saving_goals', ['user_id'], {
      name: 'idx_saving_goals_user_id',
      where: { deleted_at: null },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('saving_goals');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_saving_goals_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_saving_goals_reminder_frequency";');
  }
};
