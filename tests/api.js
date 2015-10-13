'use strict';

var _ = require('lodash');
var Browser = require('zombie');
var start = require('../census/app').start;
var assert = require('chai').assert;

var app = null;
var browser = null;

before(function(done) {
  this.timeout(20000);
  // Run the server
  start().then(function(application) {
    app = application;
    browser = new Browser({
      maxWait: 5000,
      site: 'http://global.dev.census.org:' + app.get('port') + '/'
    });
    done();
  });
});

function checkJsonResponse(browser) {
  assert.ok(browser.success);
  assert.equal(browser.resources.length, 1);
  var resource = browser.resources[0].response;
  assert.include(resource.headers.get('Content-Type'), '/json');
  // JSON will contain '{}' even on completely empty results set
  assert.notEqual(resource.body, '');
}

function checkCsvResponse(browser) {
  assert.ok(browser.success);
  assert.equal(browser.resources.length, 1);
  var resource = browser.resources[0].response;
  assert.include(resource.headers.get('Content-Type'), '/csv');
  // CSV will contain headers (at least)
  assert.notEqual(resource.body, '');
}

var responseFormats = {
  json: checkJsonResponse,
  csv: checkCsvResponse
};

describe('API', function() {
  // Each API test should check next steps:
  // 1. server should return 200 OK status;
  // 2. there should be the only resource - actually response stream;
  // 3. response should have required format (content type - either text/json or text/csv);
  // 4. response should contain requested data.

  describe('Entries', function() {
    var year = 2015;
    _.forEach(_.keys(responseFormats), function(format) {
      var checkResponse = responseFormats[format];

      describe('Format: ' + format, function() {
        this.timeout(20000);

        it('All', function(done) {
          browser.visit('/api/entries.all.' + format, function() {
            checkResponse(browser);
            done();
          });
        });

        it('All current', function(done) {
          browser.visit('/api/entries.' + format, function() {
            checkResponse(browser);
            done();
          });
        });

        it('Current cascaded', function(done) {
          browser.visit('/api/entries.cascade.' + format, function() {
            checkResponse(browser);
            done();
          });
        });

        it('All current, year: ' + year, function(done) {
          browser.visit('/api/entries/' + year + '.' + format, function() {
            checkResponse(browser);
            done();
          });
        });

        it('Current cascaded, year: ' + year, function(done) {
          browser.visit('/api/entries/' + year + '.cascade.' + format, function() {
            checkResponse(browser);
            done();
          });
        });

        it('Should fail on invalid strategy', function(done) {
          browser.visit('/api/entries.invalid.' + format, function() {
            assert.equal(browser.status, 404);
            done();
          });
        });
      });
    });
  });

  describe('Places', function() {
    var year = 2015;
    _.forEach(_.keys(responseFormats), function(format) {
      var checkResponse = responseFormats[format];

      describe('Format: ' + format, function() {
        it('All', function(done) {
          browser.visit('/api/places.' + format, function() {
            checkResponse(browser);
            done();
          });
        });
      });
    });
  });

  describe('Datasets', function() {
    var year = 2015;
    _.forEach(_.keys(responseFormats), function(format) {
      var checkResponse = responseFormats[format];

      describe('Format: ' + format, function() {
        it('All', function(done) {
          browser.visit('/api/datasets.' + format, function() {
            checkResponse(browser);
            done();
          });
        });
      });
    });
  });

  describe('Questions', function() {
    var year = 2015;
    _.forEach(_.keys(responseFormats), function(format) {
      var checkResponse = responseFormats[format];

      describe('Format: ' + format, function() {
        it('All', function(done) {
          browser.visit('/api/questions.' + format, function() {
            checkResponse(browser);
            done();
          });
        });
      });
    });
  });
});
