'use strict';

const Promise = require('bluebird');
const models = require('../models');

module.exports = {
  up: function (queryInterface, Sequelize) {
    // Use this version of the Site model, which was current at time of
    // migration.
    let Site = queryInterface.sequelize.define('Site', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false
      },
      settings: {
        type: Sequelize.JSONB,
        allowNull: false
      }
    }, {
      tableName: 'site'
    });

    return Site.findAll()
    .then(sites => {
      // For each site
      return Promise.each(sites, site => {
        // Create a QuestionSet
        return models.QuestionSet.create(
          {
            id: 'dummy-qs-' + site.id,
            site: site.id,
            qsSchema: []
          })
        .then(qs => {
          // And associates all Questions for the site
          return models.Question.findAll({where: {site: site.id}})
          .then(questions => {
            // With the newly created QuestionSet
            return Promise.each(questions, q => {
              return q.update({questionsetid: qs.id});
            });
          });
        });
      });
    });
  },

  down: function (queryInterface, Sequelize) {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
  }
};
