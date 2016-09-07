'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.addColumn('dataset', 'questionsetid',
      {
        type: Sequelize.STRING,
        allowNull: true,
        references: {
          model: 'questionset',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        comment: 'Foreign Key to associated QuestionSet.'
      });
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.removeColumn('dataset', 'questionsetid');
  }
};
