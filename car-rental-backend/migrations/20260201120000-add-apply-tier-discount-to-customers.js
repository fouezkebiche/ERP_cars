'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('customers', 'apply_tier_discount', {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('customers', 'apply_tier_discount');
  }
};
