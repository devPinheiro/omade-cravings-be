'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('orders', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      guest_email: {
        type: Sequelize.STRING,
        allowNull: true
      },
      guest_phone: {
        type: Sequelize.STRING,
        allowNull: true
      },
      guest_name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'cancelled', 'no_show'),
        allowNull: false,
        defaultValue: 'pending'
      },
      payment_status: {
        type: Sequelize.ENUM('pending', 'manual_confirmed', 'paid_on_pickup', 'bank_transfer_received', 'failed', 'refunded'),
        allowNull: false,
        defaultValue: 'pending'
      },
      payment_method: {
        type: Sequelize.ENUM('cash', 'card_on_pickup', 'bank_transfer', 'manual_entry'),
        allowNull: false,
        defaultValue: 'cash'
      },
      payment_reference: {
        type: Sequelize.STRING,
        allowNull: true
      },
      total_amount: {
        type: Sequelize.DECIMAL(8, 2),
        allowNull: false
      },
      discount_amount: {
        type: Sequelize.DECIMAL(8, 2),
        allowNull: true,
        defaultValue: 0
      },
      promo_code: {
        type: Sequelize.STRING,
        allowNull: true
      },
      pickup_instructions: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      preferred_pickup_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      preferred_pickup_time: {
        type: Sequelize.STRING,
        allowNull: true
      },
      order_number: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true
      },
      staff_notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes
    await queryInterface.addIndex('orders', ['user_id']);
    await queryInterface.addIndex('orders', ['status']);
    await queryInterface.addIndex('orders', ['payment_status']);
    await queryInterface.addIndex('orders', ['order_number']);
    await queryInterface.addIndex('orders', ['preferred_pickup_date']);
    await queryInterface.addIndex('orders', ['guest_email']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('orders');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_orders_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_orders_payment_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_orders_payment_method";');
  }
};