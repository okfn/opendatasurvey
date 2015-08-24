'use strict';

var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var Promise = require('bluebird');
var models = require('../models');
var uuid = require('node-uuid');


module.exports = {
  up: function(queryInterface, Sequelize) {

    queryInterface.createTable('notification_log', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },

      type: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false,
        comment: 'Unique name for notification'
      },

      lastAt: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Datetime notification last sent'
      }
    }).then(function() {
      queryInterface.sequelize.query(queryInterface.QueryGenerator.bulkInsertQuery('notification_log', [
        {
          id: uuid.v4(),
          type: "comments",
          lastAt: new Date()
        }]));
    });

  },

  down: function(queryInterface, Sequelize) {
    queryInterface.dropTable('notification_log');
  }
};
