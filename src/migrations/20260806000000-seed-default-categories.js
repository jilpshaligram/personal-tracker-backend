'use strict';

const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Idempotency Check: Do not insert if default categories already exist.
    const [results] = await queryInterface.sequelize.query(
      `SELECT count(*) AS count FROM "categories" WHERE "is_default" = true;`
    );

    if (parseInt(results[0].count, 10) > 0) {
      console.log('Default categories already seeded. Skipping.');
      return;
    }

    const now = new Date();

    const expenseNames = [
      'Food',
      'Shopping',
      'Grocery',
      'Transport',
      'Fuel',
      'Rent',
      'Electricity',
      'Water Bill',
      'Internet',
      'Entertainment',
      'Travel',
      'Health',
      'Education',
      'Gift',
      'Other'
    ];

    const incomeNames = [
      'Salary',
      'Freelance',
      'Business',
      'Investment',
      'Bonus',
      'Interest',
      'Rental Income',
      'Refund',
      'Other'
    ];

    const expenseCategories = expenseNames.map(name => ({
      id: uuidv4(),
      name,
      type: 'EXPENSE',
      created_by: null,
      is_default: true,
      is_active: true,
      created_at: now,
      updated_at: now,
    }));

    const incomeCategories = incomeNames.map(name => ({
      id: uuidv4(),
      name,
      type: 'INCOME',
      created_by: null,
      is_default: true,
      is_active: true,
      created_at: now,
      updated_at: now,
    }));

    const allDefaultCategories = [...expenseCategories, ...incomeCategories];

    await queryInterface.bulkInsert('categories', allDefaultCategories);
    console.log(`Successfully seeded ${allDefaultCategories.length} default categories.`);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('categories', { is_default: true }, {});
    console.log('Successfully reverted default categories.');
  }
};
