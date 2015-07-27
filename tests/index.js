var _ = require('lodash');
var Promise = require('bluebird');
var path = require('path');
var models = require('../census/models');
var data = require('../fixtures/registry')
      .concat(require('../fixtures/site'))
      .concat(require('../fixtures/user'))
      .concat(require('../fixtures/place'))
      .concat(require('../fixtures/dataset'))
      .concat(require('../fixtures/question'))
      .concat(require('../fixtures/entry'));


describe('Open Data Census Tests', function() {

  before(function(done) {

    models.umzug.up().then(function() {

      return Promise.each(data, function(obj) {
        return models[obj.model].create(obj.data)
          .then(function() {})
          .catch(console.log.bind(console));
      })
        .then(function() {
          done();
        })
        .catch(console.log.bind(console));

    });

  });

  after(function(done) {

    models.sequelize.getQueryInterface().dropAllTables()
      .then(function() {
        console.log('dropped all tables');
        done();
      })
      .catch(console.log.bind(console));

  });

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

});
