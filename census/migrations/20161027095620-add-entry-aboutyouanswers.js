'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.addColumn('entry', 'aboutYouAnswers',
      {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'A collection of answers for the About You section.'
      });
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.removeColumn('entry', 'aboutYouAnswers');
  }
};
