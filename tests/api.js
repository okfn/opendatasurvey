'use strict';

const _ = require('lodash');
const assert = require('chai').assert;
const testUtils = require('./utils');

let checkJsonResponse = function(browser, expectedLength) {
  assert.ok(browser.success);
  assert.equal(browser.resources.length, 1);
  let resource = browser.resources[0].response;
  assert.include(resource.headers.get('Content-Type'), '/json');
  // JSON will contain '{}' even on completely empty results set
  assert.notEqual(resource.body, '');
  let jsonBody = JSON.parse(resource.body);
  assert.ok(_.has(jsonBody, 'results'));
  if (expectedLength) {
    assert.equal(jsonBody.count, expectedLength);
    assert.equal(jsonBody.results.length, expectedLength);
  }
};

let checkCsvResponse = function(browser, expectedLength) {
  assert.ok(browser.success);
  assert.equal(browser.resources.length, 1);
  let resource = browser.resources[0].response;
  assert.include(resource.headers.get('Content-Type'), '/csv');
  // CSV will contain headers (at least)
  assert.notEqual(resource.body, '');
  if (expectedLength) {
    // actual length - 1 (the header line)
    assert.equal(_.trimRight(resource.body, '\n').split('\n').length - 1,
                 expectedLength);
  }
};

let responseFormats = {
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
    const year = 2015;
    _.forEach(_.keys(responseFormats), format => {
      const checkResponse = responseFormats[format];

      describe('Format: ' + format, () => {
        this.timeout(20000);

        it('All', done => {
          let browser = testUtils.browser;
          browser.visit('/api/entries.all.' + format, () => {
            checkResponse(browser, 8);
            done();
          });
        });

        it('All current', done => {
          let browser = testUtils.browser;
          browser.visit('/api/entries.' + format, () => {
            checkResponse(browser, 4);
            done();
          });
        });

        it('Current cascaded', done => {
          let browser = testUtils.browser;
          browser.visit('/api/entries.cascade.' + format, () => {
            checkResponse(browser, 4);
            done();
          });
        });

        it('Current cascaded flat', done => {
          let browser = testUtils.browser;
          browser.visit('/api/entries.cascade.flat.' + format, () => {
            checkResponse(browser, 4);
            done();
          });
        });

        it('All current, year: ' + year, done => {
          let browser = testUtils.browser;
          browser.visit('/api/entries/' + year + '.' + format, () => {
            checkResponse(browser, 3);
            done();
          });
        });

        it('Current cascaded, year: ' + year, done => {
          let browser = testUtils.browser;
          browser.visit('/api/entries/' + year + '.cascade.' + format,
            () => {
              checkResponse(browser, 4);
              done();
            });
        });

        it('Should fail on invalid strategy', done => {
          let browser = testUtils.browser;
          browser.visit('/api/entries.invalid.' + format, () => {
            assert.equal(browser.status, 404);
            done();
          });
        });
      });
    });
  });

  describe('Entries (data)', function() {
    it('All current', done => {
      let browser = testUtils.browser;
      browser.visit('/api/entries.json', () => {
        // Get first item
        browser.assert.success();
        const data = JSON.parse(browser.text());
        const item = data.results[0];
        // Check data is right
        assert.equal(item.reviewComments, '');
        assert.include(['Yes', 'No'], item.reviewed);
        assert.include(['Yes', 'No'], item.reviewResult);
        assert.include(['Yes', 'No'], item.isCurrent);
        assert.include(['Yes', 'No'], item.isOpen);
        assert.isArray(item.answers);
        // one answer for each question
        assert.equal(item.answers.length, 18);
        // answer object has correct structure
        assert.deepEqual(_.keys(item.answers[0]),
                         ['id', 'value', 'pass', 'commentValue']);
        // check `format` answer (multiple choice question)
        assert.deepEqual(_.find(item.answers, 'id', 'format').value,
                         ['AsciiDoc', 'CSV', 'HTML']);
        done();
      });
    });
  });

  describe('Flat entries (data)', function() {
    it('Cascade current', done => {
      let browser = testUtils.browser;
      browser.visit('/api/entries.cascade.flat.json', () => {
        browser.assert.success();
        const data = JSON.parse(browser.text());
        const item = data.results[0];
        assert.deepEqual(item['Format 1'], 'AsciiDoc');
        assert.deepEqual(item['Format 2'], 'CSV');
        assert.deepEqual(item['Format 3'], 'HTML');
        done();
      });
    });
  });

  describe('Places', function() {
    _.forEach(_.keys(responseFormats), format => {
      let checkResponse = responseFormats[format];
      describe('Format: ' + format, () => {
        it('All', done => {
          let browser = testUtils.browser;
          browser.visit('/api/places.' + format, () => {
            checkResponse(browser, 3);
            done();
          });
        });
      });
    });
  });

  describe('Datasets', function() {
    _.forEach(_.keys(responseFormats), format => {
      let checkResponse = responseFormats[format];
      describe('Format: ' + format, () => {
        it('All', done => {
          let browser = testUtils.browser;
          browser.visit('/api/datasets.' + format, () => {
            checkResponse(browser, 3);
            done();
          });
        });
      });
    });
  });

  describe('Questions', function() {
    _.forEach(_.keys(responseFormats), format => {
      let checkResponse = responseFormats[format];
      describe('Format: ' + format, () => {
        it('All', done => {
          let browser = testUtils.browser;
          browser.visit('/api/questions.' + format, () => {
            checkResponse(browser, 18);
            done();
          });
        });
      });
    });
  });
});
