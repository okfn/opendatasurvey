'use strict';

var _ = require('lodash');
var models = require('../census/models');
var modelUtils = require('../census/models').utils;
var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var utils = require('./utils');
var defaultOptions = {
  models: models,
  domain: 'site1',
  dataset: null,
  place: null,
  year: null,
  cascade: true,
  ynQuestions: true,
  locale: null,
  with: {Entry: true, Dataset: true, Place: true, Question: true}
};

describe('Data access layer', function() {
  this.timeout(20000);

  beforeEach(utils.setupFixtures);
  afterEach(utils.dropFixtures);

  it('works with defaults', function(done) {
    var dataOptions = {
      models: models,
      domain: 'site1',
      dataset: null,
      place: null,
      year: null,
      cascade: true,
      ynQuestions: true,
      locale: null,
      with: {Entry: true, Dataset: true, Place: true, Question: true}
    };
    modelUtils.getData(dataOptions)
      .then(function(data) {
        expect(data).to.have.property('entries');
        expect(data).to.have.property('pending');
        expect(data).to.have.property('rejected');
        expect(data).to.have.property('datasets');
        expect(data).to.have.property('places');
        expect(data).to.have.property('questions');
        done();
      })
      .catch(console.trace.bind(console));
  });

  it('keepAll=true should return all entries', function(done) {
    var dataOptions = {
      models: models,
      domain: 'site1',
      dataset: null,
      place: null,
      year: null,
      cascade: false,
      ynQuestions: false,
      locale: null,
      keepAll: true,
      with: {Entry: true, Dataset: false, Place: false, Question: false}
    };
    modelUtils.getData(dataOptions)
      .then(function(data) {
        expect(data).to.have.property('entries');
        var hasCurrent = false;
        var hasNonCurrent = false;
        _.forEach(data.entries, function(entry) {
          entry.isCurrent ? hasCurrent = true : hasNonCurrent = true;
        });
        expect(hasCurrent).to.be.true;
        expect(hasNonCurrent).to.be.true;
        done();
      })
      .catch(console.trace.bind(console));
  });

  it('keepAll=false should return only current entries', function(done) {
    var dataOptions = {
      models: models,
      domain: 'site1',
      dataset: null,
      place: null,
      year: null,
      cascade: false,
      ynQuestions: false,
      locale: null,
      with: {Entry: true, Dataset: false, Place: false, Question: false}
    };
    modelUtils.getData(dataOptions)
      .then(function(data) {
        expect(data).to.have.property('entries');
        var hasCurrent = false;
        var hasNonCurrent = false;
        _.forEach(data.entries, function(entry) {
          entry.isCurrent ? hasCurrent = true : hasNonCurrent = true;
        });
        expect(hasCurrent).to.be.true;
        expect(hasNonCurrent).to.be.false;
        done();
      })
      .catch(console.trace.bind(console));
  });

  it('does not return results of an Entry query', function(done) {
    var dataOptions = {
      models: models,
      domain: 'site1',
      dataset: null,
      place: null,
      year: null,
      cascade: true,
      ynQuestions: true,
      locale: null,
      with: {Entry: false, Dataset: true, Place: true, Question: true}
    };
    modelUtils.getData(dataOptions)
      .then(function(data) {
        expect(data).to.not.have.property('entries');
        expect(data).to.not.have.property('pending');
        expect(data).to.not.have.property('rejected');
        expect(data).to.have.property('datasets');
        expect(data).to.have.property('places');
        expect(data).to.have.property('questions');
        done();
      })
      .catch(console.trace.bind(console));
  });

  it('only returns yn questions by default', function(done) {
    var dataOptions = {
      models: models,
      domain: 'site1',
      dataset: null,
      place: null,
      year: null,
      cascade: true,
      ynQuestions: true,
      locale: null,
      with: {Entry: true, Dataset: true, Place: true, Question: true}
    };
    modelUtils.getData(dataOptions)
      .then(function(data) {
        expect(data.questions).to.have.length(9);
        done();
      })
      .catch(console.trace.bind(console));
  });

  it('can return all questions', function(done) {
    var dataOptions = {
      models: models,
      domain: 'site1',
      dataset: null,
      place: null,
      year: null,
      cascade: true,
      ynQuestions: false,
      locale: null,
      with: {Entry: true, Dataset: true, Place: true, Question: true}
    };
    modelUtils.getData(dataOptions)
      .then(function(data) {
        expect(data.questions).to.have.length(18);
        done();
      })
      .catch(console.trace.bind(console));
  });

  it('returns a place and not places when we have a place argument',
    function(done) {
      var dataOptions = {
        models: models,
        domain: 'site1',
        dataset: null,
        place: 'place11',
        year: null,
        cascade: true,
        ynQuestions: true,
        locale: null,
        with: {Entry: true, Dataset: true, Place: true, Question: true}
      };
      modelUtils.getData(dataOptions)
        .then(function(data) {
          expect(data).to.not.have.property('places');
          expect(data).to.have.property('place');
          done();
        })
        .catch(console.trace.bind(console));
    });

  it('returns a dataset and not datasets when we have a dataset argument',
    function(done) {
      var dataOptions = {
        models: models,
        domain: 'site1',
        dataset: 'dataset11',
        place: null,
        year: null,
        cascade: true,
        ynQuestions: true,
        locale: null,
        with: {Entry: true, Dataset: true, Place: true, Question: true}
      };
      modelUtils.getData(dataOptions)
        .then(function(data) {
          expect(data).to.not.have.property('datasets');
          expect(data).to.have.property('dataset');
          done();
        })
        .catch(console.trace.bind(console));
    });

  it('returns cascaded entries when cascade is true', function(done) {
    var dataOptions = {
      models: models,
      domain: 'site1',
      dataset: null,
      place: null,
      year: 2015,
      cascade: true,
      ynQuestions: true,
      locale: null,
      with: {Entry: true, Dataset: true, Place: true, Question: true}
    };
    modelUtils.getData(dataOptions)
      .then(function(data) {
        expect(data.entries).to.have.length(3);
        expect(data.pending).to.have.length(2);
        expect(data.rejected).to.have.length(1);
        done();
      })
      .catch(console.trace.bind(console));
  });

  it('returns entries by year when cascade is false', function(done) {
    var dataOptions = {
      models: models,
      domain: 'site1',
      dataset: null,
      place: null,
      year: 2015,
      cascade: false,
      ynQuestions: true,
      locale: null,
      with: {Entry: true, Dataset: true, Place: true, Question: true}
    };
    modelUtils.getData(dataOptions)
      .then(function(data) {
        expect(data.entries).to.have.length(2);
        expect(data.pending).to.have.length(2);
        expect(data.rejected).to.have.length(1);
        done();
      })
      .catch(console.trace.bind(console));
  });

});
