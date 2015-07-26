var _ = require('lodash');
var fixtures = require('sequelize-fixtures');
var path = require('path');
var models = require('../census/models');
var testDir = path.dirname(module.filename);
var repoDir = path.dirname(testDir);
var fixturesDir = path.join(repoDir, 'fixtures');
var fixtureFiles = [
  path.join(fixturesDir, 'registry.js'),
  path.join(fixturesDir, 'site.js'),
  path.join(fixturesDir, 'user.js'),
  path.join(fixturesDir, 'place.js'),
  path.join(fixturesDir, 'dataset.js'),
  path.join(fixturesDir, 'question.js')
//  path.join(fixturesDir, 'entry.js')
];


describe('Open Data Census Tests', function() {

  before(function(done) {

    // reset DB here

    fixtures.loadFiles(fixtureFiles, models).then(function(){
      console.log('fixtures loaded');
      done();
    });

  });

  after(function(done) {

    // destroy DB here
    done();
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
