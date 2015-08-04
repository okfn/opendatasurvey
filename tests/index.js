var _ = require('lodash');
var Promise = require('bluebird');
var path = require('path');
var models = require('../census/models');
var utils = require('./utils');


describe('Open Data Census Tests', function() {

  before(utils.setupFixtures);
  after(utils.dropFixtures);

  it('counts all registry entries', function(done) {

    var query = models.Registry.findAll();

    query
      .then(function(results) {
        console.log(results.length);
        done();
      })
      .catch(console.log.bind(console));

  });

  it('counts all sites', function(done) {

    var query = models.Site.findAll();

    query
      .then(function(results) {
        console.log(results.length);
        done();
      })
      .catch(console.log.bind(console));

  });

  it('counts all users', function(done) {

    var query = models.User.findAll();

    query
      .then(function(results) {
        console.log(results.length);
        done();
      })
      .catch(console.log.bind(console));

  });

  it('counts all places', function(done) {

    var query = models.Place.findAll();

    query
      .then(function(results) {
        console.log(results.length);
        done();
      })
      .catch(console.log.bind(console));

  });

  it('counts all datasets', function(done) {

    var query = models.Dataset.findAll();

    query
      .then(function(results) {
        console.log(results.length);
        done();
      })
      .catch(console.log.bind(console));

  });

  it('counts all questions', function(done) {

    var query = models.Question.findAll();

    query
      .then(function(results) {
        console.log(results.length);
        done();
      })
      .catch(console.log.bind(console));

  });

  it('counts all entries', function(done) {

    var query = models.Entry.findAll();

    query
      .then(function(results) {
        console.log(results.length);
        done();
      })
      .catch(console.log.bind(console));

  });

});
