'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.addColumn('question', 'openquestion',
      {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        comment: 'Flag to indicate if Question should be used to decide if an entry is Open.'
      });
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.removeColumn('question', 'openquestion');
  }
};
