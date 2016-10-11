'use strict';

const assert = require('chai').assert;
const models = require('../census/models');
const utils = require('./utils');

describe('Open Data Census Tests', function() {
  this.timeout(20000);

  before(utils.setupFixtures);
  after(utils.dropFixtures);

  it('counts all registry entries', function() {
    let query = models.Registry.findAll();
    return query.then(results => {
      assert.equal(results.length, 2);
    });
  });

  it('counts all sites', function() {
    let query = models.Site.findAll();
    return query.then(results => {
      assert.equal(results.length, 2);
    });
  });

  it('counts all users', function() {
    let query = models.User.findAll();
    return query.then(results => {
      assert.equal(results.length, 4);
    });
  });

  it('counts all places', function() {
    let query = models.Place.findAll();
    return query.then(results => {
      assert.equal(results.length, 5);
    });
  });

  it('counts all datasets', function() {
    let query = models.Dataset.findAll();
    return query.then(results => {
      assert.equal(results.length, 6);
    });
  });

  it('counts all questions', function() {
    let query = models.Question.findAll();
    return query.then(results => {
      assert.equal(results.length, 36);
    });
  });

  it('counts all entries', function() {
    let query = models.Entry.findAll();
    return query.then(results => {
      assert.equal(results.length, 14);
    });
  });
});
