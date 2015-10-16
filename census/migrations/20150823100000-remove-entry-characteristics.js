'use strict';

module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface.removeColumn('entry', 'characteristics');
  },
  down: function(queryInterface, Sequelize) {
    return queryInterface.addColumn('entry', 'characteristics');
  }
};
