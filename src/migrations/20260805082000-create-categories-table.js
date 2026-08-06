'use strict';

/**
 * CATEGORY MODULE: `categories` table migration
 *
 * Architecture Notes:
 * 1. Hybrid Storage: Stores both System Default categories (created_by: null, is_default: true)
 *    and User Custom categories (created_by: UUID, is_default: false).
 * 2. Type Driven: The `type` (INCOME/EXPENSE) here dictates the Transaction type.
 *    Transactions do not store INCOME/EXPENSE directly to ensure normalization.
 * 3. Soft Deletes: Preserves financial history if a category is deleted.
 * 
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * ENUM CREATION
     */
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE category_type AS ENUM ('INCOME', 'EXPENSE');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create the categories table
    await queryInterface.createTable('categories', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        allowNull: false,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      type: {
        type: Sequelize.ENUM('INCOME', 'EXPENSE'),
        allowNull: false,
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true, // NULL means system default
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      is_default: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
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
     * CONSTRAINTS
     */
    // Prevent empty names
    await queryInterface.addConstraint('categories', {
      fields: ['name'],
      type: 'check',
      where: {
        name: {
          [Sequelize.Op.ne]: ''
        }
      },
      name: 'chk_categories_name_not_empty'
    });

    // Prevent a user from having duplicate category names, or duplicate system defaults
    // Note: UNIQUE constraint considers multiple NULLs in `created_by` as distinct in standard Postgres, 
    // but typically we rely on application logic for defaults or use a coalesced index. 
    // The requirement states UNIQUE(name, created_by).
    await queryInterface.addConstraint('categories', {
      fields: ['name', 'created_by'],
      type: 'unique',
      name: 'unique_category_name_per_user'
    });

    /**
     * PARTIAL INDEXES (Paranoid Mode)
     */
    await queryInterface.addIndex('categories', ['created_by'], {
      name: 'idx_categories_created_by',
      where: { deleted_at: null },
    });

    await queryInterface.addIndex('categories', ['type'], {
      name: 'idx_categories_type',
      where: { deleted_at: null },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('categories');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS category_type;');
  },
};
