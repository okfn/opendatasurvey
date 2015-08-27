'use strict';

module.exports = {
  up: function(queryInterface, Sequelize) {
    queryInterface.addIndex('entry', ['site']);
    queryInterface.addIndex('dataset', ['site']);
    queryInterface.addIndex('place', ['site']);
    queryInterface.addIndex('question', ['site']);
  },

  down: function(queryInterface, Sequelize) {
    queryInterface.removeIndex('entry', ['site']);
    queryInterface.removeIndex('dataset', ['site']);
    queryInterface.removeIndex('place', ['site']);
    queryInterface.removeIndex('question', ['site']);
  }
};
