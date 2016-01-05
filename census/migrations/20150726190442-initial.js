'use strict';

var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var Promise = require('bluebird');
var models = require('../models');

module.exports = {
  up: function(queryInterface, Sequelize) {
    var initialSchema = fs.readFileSync(
      path.join(__dirname, '/initial.sql'), 'utf-8');
    var sqlStatements = initialSchema.split(';');

    return Promise.each(sqlStatements, function(statement) {
      return models.sequelize.query(statement)
        .then(function() {
          console.log('ran statement');
        })
        .catch(console.trace.bind(console));
    });
  },
  down: function(queryInterface, Sequelize) {
    return queryInterface.dropAllTables()
      .then(function() {})
      .catch(console.trace.bind(console));
  }
};
