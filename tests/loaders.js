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

describe('Data loaded from spread sheet into DB', function() {
  this.timeout(20000);

  before(testUtils.setupFixtures);
  after(testUtils.dropFixtures);

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

  it('#loadRegistry', function(done) {
    this.timeout(10000);

    models.Registry.destroy({truncate: true}).then(function() {
      var registryIDs;

      utils.spreadsheetParse(REGISTRY_URL || false).spread(function(E, R) {
        registryIDs = _.pluck(R, 'censusid');
        loaders.loadRegistry(models).spread(function(E, D) {
          models.Registry.findAll().then(function(D) {
            assert.deepEqual(registryIDs.sort(), _.pluck(D, 'id').sort());
            done();
          });
        });
      });
    });
  });

  it('#loadConfig', function(done) {
    this.timeout(10000);

    models.Registry.findById(siteID).then(function(R) {
      utils.spreadsheetParse(R.settings.configurl).spread(function(E, C) {
        loaders.loadConfig(siteID, models).then(function() {
          models.Site.findById(siteID).then(function(S) {
            var settings = _.object(_.zip(
              _.pluck(C, 'key'), _.pluck(C, 'value')));
            var exact = ['title', 'title_short', 'places',
              'datasets', 'questions'];

            assert.deepEqual(_.pick(S.settings, exact),
              _.pick(settings, exact));

            var settingName = 'approve_first_submission';
            assert.equal(S.settings[settingName], true);

            settingName = 'faq_page';
            assert.include(S.settings[settingName], 'FAQ');

            settingName = 'faq_page';
            assert.include(S.settings[settingName], '<p>',
              'faq page should look like html');

            done();
          });
        });
      });
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
    this.timeout(10000);

    models.Site.findById(siteID).then(function(S) {
      utils.spreadsheetParse(S.settings.datasets).spread(function(E, D) {
        loaders.loadTranslatedData({
          mapper: function(D) { return _.extend(D, {name: D.title}); },
          Model: models.Dataset,
          setting: 'datasets',
          site: siteID
        }, models).then(function() {
          models.Dataset.findAll({
            where: {site: siteID}
          }).then(function(datasets) {
            assert.equal(D.length, datasets.length);
            matchEntries(datasets, D, ['id', 'order', 'description']);
            done();
          });
        });
      });
    });
  });

  it('Places', function(done) {
    this.timeout(10000);

    models.Site.findById(siteID).then(function(S) {
      utils.spreadsheetParse(S.settings.places).spread(function(E, P) {
        loaders.loadTranslatedData({
          Model: models.Place,
          setting: 'places',
          site: siteID
        }, models).then(function() {
          models.Place.findAll({where: {site: siteID}}).then(function(places) {
            assert.equal(P.length, places.length);
            matchEntries(places, P, ['id', 'name', 'slug']);
            done();
          });
        });
      });
    });
  });

  it('Questions', function(done) {
    this.timeout(10000);

    models.Site.findById(siteID).then(function(S) {
      utils.spreadsheetParse(S.settings.questions).spread(function(E, Q) {
        loaders.loadTranslatedData({
          mapper: function(Q) {
            return _.extend(Q, {
              dependants: Q.dependants.split(','),
              score: Q.score || 0
            });
          },
          Model: models.Question,
          setting: 'questions',
          site: siteID
        }, models).then(function() {
          models.Question.findAll({
            where: {site: siteID}
          }).then(function(questions) {
            assert.equal(questions.length, Q.length);
            matchEntries(questions, Q, ['id', 'order', 'question', 'icon']);
            done();
          });
        });
      });
    });
  });

  it('Places not in the spreadsheet should be cleared out', function(done) {
    this.timeout(10000);

    models.Site.findById(siteID).then(function(S) {
      models.Place.create({
        id: 'place',
        site: 'site',
        name: 'name'
      }).then(function() {
        utils.spreadsheetParse(S.settings.places).spread(function(E, P) {
          loaders.loadTranslatedData({
            Model: models.Place,
            setting: 'places',
            site: siteID
          }, models).then(function() {
            models.Place.findAll({
              where: {site: siteID}
            }).then(function(places) {
              assert.equal(P.length, places.length);
              matchEntries(places, P, ['id', 'name', 'slug']);
              done();
            });
          });
        });
      });
    });
  });

  it('Dataset load failure should rollback the transaction.', function(done) {
    this.timeout(10000);

    return models.Site.findById(siteID).then(function(S) {
      utils.spreadsheetParse(S.settings.datasets).spread(function(E, D) {
        loaders.loadTranslatedData({
          // modify datasets to have duplicate ids
          mapper: function(D) {
            return _.extend(D, {
              name: D.title,
              id: 'dataset'
            });
          },
          Model: models.Dataset,
          setting: 'datasets',
          site: siteID
        }, models)
        .catch(models.sequelize.UniqueConstraintError, function() {
          models.Dataset.findAll({
            where: {site: siteID}
          }).then(function(datasets) {
            assert.equal(D.length, datasets.length);
            matchEntries(datasets, D, ['id', 'order', 'description']);
            done();
          });
        });
      });
    });
  });

});
