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
      var item = browser.query('.lang-picker a');
      var prevLanguage = browser.getCookie('lang');
      var requestedLanguage = item.textContent;
      browser.visit(item.getAttribute('href'), function() {
        var newLanguage = browser.getCookie('lang');
        if (!!prevLanguage) {
          assert(('' + prevLanguage).toLowerCase() != ('' + newLanguage).toLowerCase());
        }
        assert(('' + requestedLanguage).toLowerCase() == ('' + newLanguage).toLowerCase());
        done();
      });
    });
  });
});
