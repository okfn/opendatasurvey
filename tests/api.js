'use strict';

var _ = require('lodash');
var assert = require('chai').assert;
var testUtils = require('./utils');

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
  before(testUtils.startApplication);
  after(testUtils.shutdownApplication);

  // Each API test should check next steps:
  // 1. server should return 200 OK status;
  // 2. there should be the only resource - actually response stream;
  // 3. response should have required format (content type - either
  //   text/json or text/csv);
  // 4. response should contain requested data.

  describe('Entries', function() {
    var year = 2015;
    _.forEach(_.keys(responseFormats), function(format) {
      var checkResponse = responseFormats[format];

      describe('Format: ' + format, function() {
        this.timeout(20000);

        it('All', function(done) {
          var browser = testUtils.browser;
          browser.visit('/api/entries.all.' + format, function() {
            checkResponse(browser);
            done();
          });
        });

        it('All current', function(done) {
          var browser = testUtils.browser;
          browser.visit('/api/entries.' + format, function() {
            checkResponse(browser);
            done();
          });
        });

        it('Current cascaded', function(done) {
          var browser = testUtils.browser;
          browser.visit('/api/entries.cascade.' + format, function() {
            checkResponse(browser);
            done();
          });
        });

        it('All current, year: ' + year, function(done) {
          var browser = testUtils.browser;
          browser.visit('/api/entries/' + year + '.' + format, function() {
            checkResponse(browser);
            done();
          });
        });

        it('Current cascaded, year: ' + year, function(done) {
          var browser = testUtils.browser;
          browser.visit('/api/entries/' + year + '.cascade.' + format,
            function() {
              checkResponse(browser);
              done();
            });
        });

        it('Should fail on invalid strategy', function(done) {
          var browser = testUtils.browser;
          browser.visit('/api/entries.invalid.' + format, function() {
            assert.equal(browser.status, 404);
            done();
          });
        });
      });
    });
  });

  describe('Entries (data)', function() {

    it('All current', function(done) {
      var browser = testUtils.browser;
      browser.visit('/api/entries.json', function() {

        // Get first item
        browser.assert.success();
        var data = JSON.parse(browser.text());
        var item = data['results'][0];

        // Check data is right
        assert.equal(item.reviewComments, '');
        assert.include(['Yes', 'No'], item.reviewed);
        assert.include(['Yes', 'No'], item.reviewResult);
        assert.include(['Yes', 'No'], item.isCurrent);
        assert.include(['Yes', 'No'], item.isOpen);

        done();

      });
    });

  });

  describe('Places', function() {
    var year = 2015;
    _.forEach(_.keys(responseFormats), function(format) {
      var checkResponse = responseFormats[format];

      describe('Format: ' + format, function() {
        it('All', function(done) {
          var browser = testUtils.browser;
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
          var browser = testUtils.browser;
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
          var browser = testUtils.browser;
          browser.visit('/api/questions.' + format, function() {
            checkResponse(browser);
            done();
          });
        });
      });
    });
  });
});
