'use strict';

var models = require('../census/models');
var modelUtils = require('../census/models').utils;
var utils = require('./utils');


describe('Data access layer', function() {

  beforeEach(utils.setupFixtures);
  afterEach(utils.dropFixtures);

  it('basically works', function(done) {
    var dataOptions = {
      models: models,
      year: 2015,
      domain: 'site1'
    };
    modelUtils.getData(dataOptions)
      .then(function(data) {
        console.log('yep');
        console.log(data);
        done();
      })
      .catch(console.log.bind(console));
  });

});
