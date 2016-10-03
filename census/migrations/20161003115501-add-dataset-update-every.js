'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.addColumn('dataset', 'updateevery',
      {
        type: Sequelize.STRING(),
        allowNull: true,
        comment: 'A time interval to determine timeliness for the dataset.'
      });
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.removeColumn('dataset', 'updateevery');
  }
};
