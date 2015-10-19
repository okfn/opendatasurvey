'use strict';

module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface.removeColumn('entry', 'comments');
  },
  down: function(queryInterface, Sequelize) {
    return queryInterface.addColumn('entry', 'comments');
  }
};
