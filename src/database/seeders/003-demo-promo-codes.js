'use strict';

const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(now.getMonth() + 1);
    const nextYear = new Date();
    nextYear.setFullYear(now.getFullYear() + 1);

    const promoCodes = [
      {
        id: uuidv4(),
        code: 'WELCOME10',
        discount_type: 'percent',
        amount: 10.00,
        valid_from: now,
        valid_to: nextYear,
        usage_limit: 100,
        used_count: 0
      },
      {
        id: uuidv4(),
        code: 'NEWCUSTOMER',
        discount_type: 'fixed',
        amount: 5.00,
        valid_from: now,
        valid_to: nextMonth,
        usage_limit: 50,
        used_count: 0
      },
      {
        id: uuidv4(),
        code: 'FREESHIP',
        discount_type: 'percent',
        amount: 15.00,
        valid_from: now,
        valid_to: nextYear,
        usage_limit: null, // No limit
        used_count: 0
      }
    ];

    await queryInterface.bulkInsert('promo_codes', promoCodes);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('promo_codes', {
      code: {
        [Sequelize.Op.in]: ['WELCOME10', 'NEWCUSTOMER', 'FREESHIP']
      }
    });
  }
};