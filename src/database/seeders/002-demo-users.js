'use strict';

const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Only create demo users in development
    if (process.env.NODE_ENV === 'production') {
      return;
    }

    const hashedPassword = await bcrypt.hash('demo123', 12);
    const adminId = '121293d1-41dd-4b6e-ad80-ba9586694c8f';
    const customerId = 'ef85786e-cc45-4ffd-8e36-3aca30b66b8e';

    const users = [
      {
        id: adminId,
        name: 'Admin User',
        email: 'admin@omadecravings.com',
        password_hash: hashedPassword,
        role: 'admin',
        phone: '+1234567890',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: customerId,
        name: 'John Customer',
        email: 'customer@example.com',
        password_hash: hashedPassword,
        role: 'customer',
        phone: '+1234567891',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await queryInterface.bulkInsert('users', users);

    // Create loyalty points for demo users
    const loyaltyPoints = [
      {
        id: uuidv4(),
        user_id: adminId,
        points: 100,
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        user_id: customerId,
        points: 250,
        updatedAt: new Date()
      }
    ];

    await queryInterface.bulkInsert('loyalty_points', loyaltyPoints);
  },

  async down(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === 'production') {
      return;
    }
    
    await queryInterface.bulkDelete('loyalty_points', null, {});
    await queryInterface.bulkDelete('users', {
      email: {
        [Sequelize.Op.in]: ['admin@omadecravings.com', 'customer@example.com']
      }
    });
  }
};