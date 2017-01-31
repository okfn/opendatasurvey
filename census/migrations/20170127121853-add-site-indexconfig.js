'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.addColumn('site', 'indexSettings',
      {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Index configuration settings.'
      });
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.removeColumn('site', 'indexSettings');
  }
};

