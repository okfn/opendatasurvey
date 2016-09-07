'use strict';

var data = require('../fixtures/registry')
      .concat(require('../fixtures/site'))
      .concat(require('../fixtures/user'))
      .concat(require('../fixtures/place'))
      .concat(require('../fixtures/questionset'))
      .concat(require('../fixtures/dataset'))
      .concat(require('../fixtures/question'))
      .concat(require('../fixtures/entry'));
var models = require('../census/models');
var Promise = require('bluebird');

var _ = require('lodash');
var Browser = require('zombie');
var start = require('../census/app').start;
var assert = require('chai').assert;
var utils = require('./utils');

module.exports = exports = {};

exports.app = null;
exports.server = null;
exports.browser = null;

exports.startApplication = function(done) {
  this.timeout(20000);
  exports.setupFixtures(function() {
    if (!module.exports.app) {
      // Run the server
      start().then(function(result) {
        var app = result.app;
        exports.app = result.app;
        exports.server = result.server;
        var port = app.get('port');
        Browser.localhost('*.dev.census.org:' + port, port);
        exports.browser = new Browser({
          maxWait: 5000,
          site: 'http://site1.dev.census.org:' + port + '/'
        });
        done();
      });
    }
  });
};

exports.shutdownApplication = function(done) {
  exports.server.close();
  exports.server = null;
  exports.app = null;
  exports.browser = null;
  exports.dropFixtures(done);
};

exports.setupFixtures = function(done) {
  models.sequelize.getQueryInterface().dropAllTables()
    .then(function() {

      models.umzug.up().then(function() {

        return Promise.each(data, function(obj) {
          return models[obj.model].create(obj.data)
            .then(function() {})
            .catch(console.trace.bind(console));
        })
          .then(function() {
            // console.log('fixtures loaded');
            done();
          })
          .catch(console.trace.bind(console));

      });

    });
};

exports.dropFixtures = function(done) {
  models.sequelize.getQueryInterface().dropAllTables()
    .then(function() {
      // console.log('dropped all tables');
      done();
    })
    .catch(console.trace.bind(console));
};
