'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('documents').catch(() => null);
    if (tableInfo && tableInfo.id && tableInfo.id.type !== 'UUID') {
      await queryInterface.sequelize.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
      await queryInterface.sequelize.query(`
        ALTER TABLE documents ALTER COLUMN id DROP DEFAULT;
        ALTER TABLE documents ALTER COLUMN id TYPE UUID USING (gen_random_uuid());
        ALTER TABLE documents ALTER COLUMN id SET DEFAULT gen_random_uuid();
      `);
    }
  },

  async down(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('documents').catch(() => null);
    if (tableInfo && tableInfo.id && tableInfo.id.type === 'UUID') {
      await queryInterface.changeColumn('documents', 'id', {
        type: Sequelize.INTEGER,
        autoIncrement: true,
      });
    }
  },
};
