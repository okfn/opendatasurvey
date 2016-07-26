'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.addColumn('dataset', 'disableforyears',
      {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true,
        comment: 'Years for which dataset is disabled.'
      });
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.removeColumn('dataset', 'disableforyears');
  }
};

