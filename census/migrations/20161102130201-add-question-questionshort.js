'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.addColumn('question', 'questionshort',
      {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'A very short version of the question.'
      });
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.removeColumn('question', 'questionshort');
  }
};
