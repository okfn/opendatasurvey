'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.addColumn('question', 'questionsetid',
      {
        type: Sequelize.STRING,
        allowNull: true,
        references: {
          model: 'questionset',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        comment: 'Foreign Key to associated QuestionSet.'
      });
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.removeColumn('question', 'questionsetid');
  }
};
