'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('custom_cake_configurations', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      order_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'orders',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      flavor: {
        type: Sequelize.STRING,
        allowNull: false
      },
      size: {
        type: Sequelize.STRING,
        allowNull: false
      },
      frosting: {
        type: Sequelize.STRING,
        allowNull: false
      },
      message: {
        type: Sequelize.STRING,
        allowNull: true
      },
      image_reference: {
        type: Sequelize.STRING,
        allowNull: true
      },
      extra_details: {
        type: Sequelize.JSONB,
        allowNull: true
      }
    });

    // Add indexes
    await queryInterface.addIndex('custom_cake_configurations', ['order_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('custom_cake_configurations');
  }
};