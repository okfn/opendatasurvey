'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.addColumn('question', 'config',
      {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Question-type specific configuration.'
      });
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.removeColumn('question', 'config');
  }
};
