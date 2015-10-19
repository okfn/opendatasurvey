'use strict';

var _ = require('lodash');
var assert = require('chai').assert;
var config = require('../census/config');
var loaders = require('../census/loaders');
var models = require('../census/models');
var siteID = 'site1';
var utils = require('../census/loaders/utils');
var REGISTRY_URL = 'https://docs.google.com/spreadsheets/d/1FK5dzeNeJl81oB76n' +
  'WzhS1dAdnXDoZbbe_vTH4NlThM/edit#gid=0';
var testUtils = require('./utils');
var userFixtures = require('../fixtures/user');

describe('Data loaded from spread sheet into DB', function() {
  this.timeout(20000);

  before(testUtils.startApplication);
  after(testUtils.shutdownApplication);

  beforeEach(function() {
    var config = testUtils.app.get('config');
    config.set('test:testing', true);
    config.set('test:user', {
      userid: userFixtures[0].data.id,
      emails: userFixtures[0].data.emails
    });
  });

  var configValues = {
    registryUrl: config.get('registryUrl')
  };

  before(function() {
    config.set('registryUrl', REGISTRY_URL);
  });

  after(function() {
    for (var setting in configValues) {
      config.set(setting, configValues[setting]);
    }
  });

  it('loadConfig', function(done) {
    var browser = testUtils.browser;
    var app = testUtils.app;
    app.get('models').Site.findById(siteID).then(function(site) {
      if (site) {
        browser.visit('/admin/load/config', function() {
          assert.ok(browser.success);
          var html = browser.resources[0].response.body;
          var data = JSON.parse(html);
          assert.equal(data.status, 'ok');
          assert.equal(data.message, 'ok');
          app.get('models').Site.findById(siteID).then(function(data){
            assert.isNotNull(data);
            assert.notEqual(data.places, '');
            assert.notEqual(data.places, '');
            assert.notEqual(data.datasets, '');
            assert.notEqual(data.questions, '');
          });
          done();
        });
      }
    });
  });

  var matchEntries = function(dbEntries, entries, matchFields) {
    _.each(dbEntries, function(dbEntry) {
      var entry = _.find(entries, 'id', dbEntry.id);
      var dbValues = _.mapValues(_.pick(dbEntry, matchFields),
        function(value) {
          return _.isNumber(value) ? value.toString() : value;
        });
      var values = _.pick(entry, matchFields);
      assert.deepEqual(dbValues, values);
    });
  };

  it('Datasets', function(done) {
    var browser = testUtils.browser;
    var app = testUtils.app;
    app.get('models').Site.findById(siteID).then(function(site) {
      if (site) {
        browser.visit('/admin/load/places', function() {
          assert.ok(browser.success);
          var html = browser.resources[0].response.body;
          var data = JSON.parse(html);
          assert.equal(data.status, 'ok');
          assert.equal(data.message, 'ok');
          app.get('models').Dataset.findAll({where: {site: siteID}}).then(function(data){
            assert.equal(data.length, 2);
          });
          done();
        });
      }
    });
  });

  it('Places', function(done) {
    var browser = testUtils.browser;
    var app = testUtils.app;
    app.get('models').Site.findById(siteID).then(function(site) {
      if (site) {
        browser.visit('/admin/load/places', function() {
          assert.ok(browser.success);
          var html = browser.resources[0].response.body;
          var data = JSON.parse(html);
          assert.equal(data.status, 'ok');
          assert.equal(data.message, 'ok');
          app.get('models').Place.findAll({where: {site: siteID}}).then(function(data){
            assert.equal(data.length, 3);
          });
          done();
        });
      }
    });
  });

  it('Questions', function(done) {
    var browser = testUtils.browser;
    var app = testUtils.app;
    app.get('models').Site.findById(siteID).then(function(site) {
      if (site) {
        browser.visit('/admin/load/questions', function() {
          assert.ok(browser.success);
          var html = browser.resources[0].response.body;
          var data = JSON.parse(html);
          assert.equal(data.status, 'ok');
          assert.equal(data.message, 'ok');
          app.get('models').Question.findAll({where: {site: siteID}}).then(function(data){
            assert.equal(data.length, 18);
          });
          done();
        });
      }
    });
  });

});
