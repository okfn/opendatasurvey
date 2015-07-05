IN_TESTING = true;

var _ = require('underscore');
var assert = require('chai').assert;
var config = require('../census/config');
var loaders = require('../census/loaders');
var models = require('../census/models');
var siteID = 'demo';
var spreadSheetHandler = require('../census/loaders/includes/spreadSheetHandler');


describe('Data loaded from spread sheet into DB', function(){
  beforeEach(function(done) {
    models.sequelize.sync().then(function () {
      console.log('Synced!');
      done();
    });
  });

  it('Registry', function(done) {
    this.timeout(5000);

    models.Registry.destroy({truncate: true}).then(function() {
      var registryIDs;

      spreadSheetHandler.parse(config.get('registryUrl') || false).spread(function (E, R) {
        registryIDs = _.pluck(R, 'censusid');

        loaders.loadRegistry('demo').spread(function(E, D) {
          models.Registry.findAll().then(function(D) { assert.deepEqual(registryIDs, _.pluck(D, 'id')); done(); });
        });
      });
    });
  });

  it('Config', function(done) {
    this.timeout(5000);

    models.Registry.findById('demo').then(function(R) {
      spreadSheetHandler.parse(R.settings.configurl).spread(function (E, C) {
        loaders.loadConfig(siteID).then(function() {
          models.Site.findById(siteID).then(function(S) {
            assert.deepEqual(S.settings, _.object(_.zip(_.pluck(C, 'key'), _.pluck(C, 'value'))));
            done();
          });
        });
      });
    });
  });

  it('Datasets', function(done) {
    this.timeout(5000);

    models.Site.findById('demo').then(function(S) {
      spreadSheetHandler.parse(S.settings.datasets).spread(function (E, D) {
        loaders.loadTranslatedData({
          mapper : function(D) { return _.extend(D, {name: D.title}); },
          Model  : models.Dataset,
          setting: 'datasets',
          site   : 'demo'
        }).then(function() {
          models.Dataset.count().then(function(C) { assert.equal(C, D.length); done(); });
        });
      });
    });
  });

  it('Places', function(done) {
    this.timeout(5000);

    models.Site.findById('demo').then(function(S) {
      spreadSheetHandler.parse(S.settings.places).spread(function (E, D) {
        loaders.loadTranslatedData({
          Model: models.Place,
          setting: 'places',
          site: 'demo'
        }).then(function() {
          models.Place.count().then(function(C) { assert.equal(C, D.length); done(); });
        });
      });
    });
  });

  it('Questions', function(done) {
    this.timeout(5000);

    models.Site.findById('demo').then(function(S) {
      spreadSheetHandler.parse(S.settings.questions).spread(function (E, D) {
        loaders.loadTranslatedData({
          mapper : function(D) { return _.extend(D, {dependants: D.dependants.split(','), score: D.score || 0}) },
          Model  : models.Question,
          setting: 'questions',
          site   : 'demo'
        }).then(function() {
          models.Question.count().then(function(C) { assert.equal(C, D.length); done(); });
        });
      });
    });
  });
});
