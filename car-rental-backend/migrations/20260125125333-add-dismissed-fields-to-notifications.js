'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Step 1: Add the 'dismissed' column
    await queryInterface.addColumn('notifications', 'dismissed', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    });

    // Step 2: Add the 'dismissed_at' column
    await queryInterface.addColumn('notifications', 'dismissed_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    // Step 3: Add the index on 'dismissed' (for fast queries)
    await queryInterface.addIndex('notifications', ['dismissed']);
  },

  async down(queryInterface, Sequelize) {
    // Undo: Drop index, then columns (if you need to rollback)
    await queryInterface.removeIndex('notifications', 'notifications_dismissed');
    await queryInterface.removeColumn('notifications', 'dismissed_at');
    await queryInterface.removeColumn('notifications', 'dismissed');
  }
};