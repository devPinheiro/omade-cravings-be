'use strict';

const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const products = [
      {
        id: uuidv4(),
        name: 'Classic Chocolate Cake',
        description: 'Rich and moist chocolate cake with chocolate ganache frosting',
        price: 25.99,
        category: 'Cakes',
        stock: 10,
        image_url: '/images/chocolate-cake.jpg',
        is_customizable: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Red Velvet Cupcakes (6 pack)',
        description: 'Classic red velvet cupcakes with cream cheese frosting',
        price: 18.99,
        category: 'Cupcakes',
        stock: 15,
        image_url: '/images/red-velvet-cupcakes.jpg',
        is_customizable: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Artisan Sourdough Bread',
        description: 'Freshly baked sourdough bread with a crispy crust',
        price: 8.99,
        category: 'Breads',
        stock: 20,
        image_url: '/images/sourdough-bread.jpg',
        is_customizable: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Custom Birthday Cake',
        description: 'Personalized birthday cake with your choice of flavors and decorations',
        price: 45.00,
        category: 'Custom Cakes',
        stock: 999,
        image_url: '/images/custom-birthday-cake.jpg',
        is_customizable: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Blueberry Muffins (4 pack)',
        description: 'Fresh blueberry muffins with a tender crumb',
        price: 12.99,
        category: 'Pastries',
        stock: 25,
        image_url: '/images/blueberry-muffins.jpg',
        is_customizable: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await queryInterface.bulkInsert('products', products);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('products', null, {});
  }
};