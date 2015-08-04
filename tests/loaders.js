// var _ = require('underscore');
// var assert = require('chai').assert;
// var config = require('../census/config');
// var loaders = require('../census/loaders');
// var models = require('../census/models');
// var siteID = 'demo';
// var utils = require('../census/loaders/utils');
// var REGISTRY_URL = 'https://docs.google.com/spreadsheets/d/1FK5dzeNeJl81oB76nWzhS1dAdnXDoZbbe_vTH4NlThM/edit#gid=0';
// var testUtils = require('./utils');


// describe('Data loaded from spread sheet into DB', function(){

//   before(testUtils.setupFixtures);
//   after(testUtils.dropFixtures);

//   it('Registry', function(done) {
//     this.timeout(10000);

//     models.Registry.destroy({truncate: true}).then(function() {
//       var registryIDs;

//       utils.spreadsheetParse(REGISTRY_URL || false).spread(function (E, R) {
//         registryIDs = _.pluck(R, 'censusid');
//         loaders.loadRegistry('site1').spread(function(E, D) {
//           models.Registry.findAll().then(function(D) { assert.deepEqual(registryIDs, _.pluck(D, 'id')); done(); });
//         });
//       });
//     });
//   });

  // it('Config', function(done) {
  //   this.timeout(10000);

  //   models.Registry.findById('site1').then(function(R) {
  //     utils.spreadsheetParse(R.settings.configurl).spread(function (E, C) {
  //       loaders.loadConfig(siteID).then(function() {
  //         models.Site.findById(siteID).then(function(S) {
  //           assert.deepEqual(S.settings, _.object(_.zip(_.pluck(C, 'key'), _.pluck(C, 'value'))));
  //           done();
  //         });
  //       });
  //     });
  //   });
  // });

  // it('Datasets', function(done) {
  //   this.timeout(10000);

  //   models.Site.findById('site1').then(function(S) {
  //     utils.spreadsheetParse(S.settings.datasets).spread(function (E, D) {
  //       loaders.loadTranslatedData({
  //         mapper : function(D) { return _.extend(D, {name: D.title}); },
  //         Model  : models.Dataset,
  //         setting: 'datasets',
  //         site   : 'site1'
  //       }).then(function() {
  //         models.Dataset.count().then(function(C) { assert.equal(C, D.length); done(); });
  //       });
  //     });
  //   });
  // });

  // it('Places', function(done) {
  //   this.timeout(10000);

  //   models.Site.findById('site1').then(function(S) {
  //     utils.spreadsheetParse(S.settings.places).spread(function (E, D) {
  //       loaders.loadTranslatedData({
  //         Model: models.Place,
  //         setting: 'places',
  //         site: 'site1'
  //       }).then(function() {
  //         models.Place.count().then(function(C) { assert.equal(C, D.length); done(); });
  //       });
  //     });
  //   });
  // });

  // it('Questions', function(done) {
  //   this.timeout(10000);

  //   models.Site.findById('site1').then(function(S) {
  //     utils.spreadsheetParse(S.settings.questions).spread(function (E, D) {
  //       loaders.loadTranslatedData({
  //         mapper : function(D) { return _.extend(D, {dependants: D.dependants.split(','), score: D.score || 0}) },
  //         Model  : models.Question,
  //         setting: 'questions',
  //         site   : 'site1'
  //       }).then(function() {
  //         models.Question.count().then(function(C) { assert.equal(C, D.length); done(); });
  //       });
  //     });
  //   });
  // });
// });
