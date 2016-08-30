'use strict';

module.exports = {
  up: function(queryInterface, Sequelize) {
    queryInterface.createTable('questionset', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false,
        unique: true,
        comment: 'id of the questionset. A hash of the site id + questionset url.'
      },
      site: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false,
        comment: 'Site this questionset belongs to.'
      },
      qsSchema: {
        type: Sequelize.JSONB,
        allowNull: false,
        comment: 'QuestionSet schema json object.'
      },
      createdAt: {
        type: Sequelize.DATE
      },
      updatedAt: {
        type: Sequelize.DATE
      }
    });
  },
  down: function(queryInterface, Sequelize) {
    queryInterface.dropTable('questionset');
  }
};
