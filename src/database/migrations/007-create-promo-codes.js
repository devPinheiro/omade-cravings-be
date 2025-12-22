'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('promo_codes', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      code: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      discount_type: {
        type: Sequelize.ENUM('percent', 'fixed'),
        allowNull: false
      },
      amount: {
        type: Sequelize.DECIMAL(8, 2),
        allowNull: false
      },
      valid_from: {
        type: Sequelize.DATE,
        allowNull: false
      },
      valid_to: {
        type: Sequelize.DATE,
        allowNull: false
      },
      usage_limit: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      used_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      }
    });

    // Add indexes
    await queryInterface.addIndex('promo_codes', ['code']);
    await queryInterface.addIndex('promo_codes', ['valid_from', 'valid_to']);
    await queryInterface.addIndex('promo_codes', ['discount_type']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('promo_codes');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_promo_codes_discount_type";');
  }
};