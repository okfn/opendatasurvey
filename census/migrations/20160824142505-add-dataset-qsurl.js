'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.addColumn('dataset', 'qsurl',
      {
        type: Sequelize.STRING(),
        allowNull: true,
        comment: 'A URL pointing to the QuestionSet used by this dataset.'
      });
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.removeColumn('dataset', 'qsurl');
  }
};
