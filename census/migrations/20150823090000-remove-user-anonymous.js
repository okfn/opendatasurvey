'use strict';

module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface.removeColumn('user', 'anonymous');
  },
  down: function(queryInterface, Sequelize) {
    return queryInterface.addColumn('user', 'anonymous');
  }
};
