'use strict';

const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    
    // Create demo orders
    const orders = [
      {
        id: uuidv4(),
        user_id: null, // Guest order
        guest_email: 'guest@example.com',
        guest_phone: '+1234567892',
        guest_name: 'Guest Customer',
        status: 'pending',
        payment_status: 'pending',
        payment_method: 'cash',
        total_amount: 25.99,
        discount_amount: 0,
        order_number: 'ORD202601040001',
        preferred_pickup_date: new Date(Date.now() + 86400000), // Tomorrow
        preferred_pickup_time: '14:00',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        user_id: 'ef85786e-cc45-4ffd-8e36-3aca30b66b8e', // John Customer
        guest_email: null,
        guest_phone: null,
        guest_name: null,
        status: 'confirmed',
        payment_status: 'manual_confirmed',
        payment_method: 'bank_transfer',
        total_amount: 18.99,
        discount_amount: 1.89,
        promo_code: 'WELCOME10',
        order_number: 'ORD202601040002',
        preferred_pickup_date: new Date(Date.now() + 172800000), // Day after tomorrow
        preferred_pickup_time: '16:30',
        pickup_instructions: 'Call when ready',
        createdAt: now,
        updatedAt: now,
      }
    ];

    await queryInterface.bulkInsert('orders', orders, {});

    // Create order items
    const orderItems = [
      {
        id: uuidv4(),
        order_id: orders[0].id,
        product_id: 'fc53b92e-04f8-4193-840f-62cfa546b9c2', // Chocolate Cake
        quantity: 1,
        unit_price: 25.99,
        subtotal: 25.99,
      },
      {
        id: uuidv4(),
        order_id: orders[1].id,
        product_id: 'c22d20f7-016e-451e-b6f5-5ec5fd4936b3', // Red Velvet Cupcakes
        quantity: 1,
        unit_price: 18.99,
        subtotal: 18.99,
      }
    ];

    await queryInterface.bulkInsert('order_items', orderItems, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('order_items', null, {});
    await queryInterface.bulkDelete('orders', null, {});
  }
};