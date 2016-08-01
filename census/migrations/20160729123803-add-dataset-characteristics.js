'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.addColumn('dataset', 'characteristics',
      {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true,
        comment: 'An array of dataset characterstics.'
      });
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.removeColumn('dataset', 'characteristics');
  }
};
