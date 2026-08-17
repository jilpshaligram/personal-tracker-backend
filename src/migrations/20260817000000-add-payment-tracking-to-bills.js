module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('bills', 'paidAmount', {
      type: Sequelize.DECIMAL(10, 2),
      defaultValue: 0,
      allowNull: false,
    });

    await queryInterface.addColumn('bills', 'remainingAmount', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    });

    // Update existing bills to set remainingAmount = amount - paidAmount
    await queryInterface.sequelize.query(`
      UPDATE bills
      SET "remainingAmount" = amount - COALESCE("paidAmount", 0)
      WHERE "deletedAt" IS NULL;
    `);
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('bills', 'paidAmount');
    await queryInterface.removeColumn('bills', 'remainingAmount');
  },
};
