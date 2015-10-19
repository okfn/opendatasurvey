'use strict';

var _ = require('lodash');
var assert = require('chai').assert;
var testUtils = require('./utils');

describe('Localization', function() {
  before(testUtils.startApplication);
  after(testUtils.shutdownApplication);

  it('Site1 should have no language switcher (default)', function(done) {
    this.timeout(20000);
    var browser = testUtils.browser;
    var port = testUtils.app.get('port');
    browser.site = 'http://site1.dev.census.org:' + port + '/';
    browser.visit('/', function() {
      assert.ok(browser.success);
      var items = browser.queryAll('.lang-picker span, .lang-picker a');
      assert.equal(items.length, 0);
      done();
    });
  });

  it('Site2 should have two languages', function(done) {
    this.timeout(20000);
    var browser = testUtils.browser;
    var port = testUtils.app.get('port');
    browser.site = 'http://site2.dev.census.org:' + port + '/';
    browser.visit('/', function() {
      assert.ok(browser.success);
      var items = browser.queryAll('.lang-picker span, .lang-picker a');
      assert.equal(items.length, 2);
      done();
    });
  });

  it('Site2 should allow to change language', function(done) {
    this.timeout(20000);
    var browser = testUtils.browser;
    var port = testUtils.app.get('port');
    browser.site = 'http://site2.dev.census.org:' + port + '/';
    browser.visit('/', function() {
      assert.ok(browser.success);
      var item = browser.query('.lang-picker span');
      assert(!!item, 'There should be current language indicator');
      var prevLanguage = item.textContent;

      item = browser.query('.lang-picker a');
      assert(!!item, 'There should be language switcher');
      var requestedLanguage = item.textContent;

      browser.visit(item.getAttribute('href'), function() {
        assert.ok(browser.success);
        var item = browser.query('.lang-picker span');
        assert(!!item, 'There should be current language indicator');
        var newLanguage = item.textContent;
        assert(prevLanguage != newLanguage,
          'New language should be different from previous');
        assert(requestedLanguage == newLanguage,
          'New language should be the one that we requested');
        done();
      });
    });
  });
});
