'use strict';

var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var Promise = require('bluebird');
var models = require('../models');


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
    });

  },

  down: function(queryInterface, Sequelize) { }
};
