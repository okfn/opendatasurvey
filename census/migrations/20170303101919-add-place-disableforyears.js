'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.addColumn('place', 'disableforyears',
      {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true,
        comment: 'Years for which place is disabled.'
      });
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.removeColumn('place', 'disableforyears');
  }
};

