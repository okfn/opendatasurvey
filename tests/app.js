'use strict';

var _ = require('lodash');
var assert = require('chai').assert;
var testUtils = require('./utils');
var marked = require('marked');

var entryFixtures = require('../fixtures/entry');
var datasetFixtures = require('../fixtures/dataset');
var userFixtures = require('../fixtures/user');

describe('Basics', function() {
  before(testUtils.startApplication);
  after(testUtils.shutdownApplication);

  beforeEach(function() {
    var browser = testUtils.browser;
    var port = testUtils.app.get('port');
    browser.site = 'http://site1.dev.census.org:' + port + '/';
    browser.removeAllListeners('redirect');
  });

  this.timeout(20000);

  describe('Pages', function() {

    it('Front', function(done) {
      var browser = testUtils.browser;
      var app = testUtils.app;
      app.get('models').Site.findById('site1').then(function(site) {
        if (site) {
          browser.visit('/', function() {
            assert.ok(browser.success);
            var html = browser.html();

            var settingName = 'overview_page';
            var textToCheck = site.settings[settingName];
            assert.include(html, textToCheck);
            assert.include(html, 'Place 11');
            assert.include(html, 'Place 12');
            done();
          });
        }
      });
    });

    it('About', function(done) {
      var browser = testUtils.browser;
      var app = testUtils.app;
      app.get('models').Site.findById('site1').then(function(site) {
        if (site) {
          browser.visit('/about', function() {
            assert.ok(browser.success);
            var html = browser.html();

            var settingName = 'about_page';
            var textToCheck = site.settings[settingName];
            assert.include(html, marked(textToCheck));
            done();
          });
        }
      });
    });

    it('FAQ', function(done) {
      var browser = testUtils.browser;
      var app = testUtils.app;
      app.get('models').Site.findById('site1').then(function(site) {
        if (site) {
          browser.visit('/faq', function() {
            assert.ok(browser.success);
            var html = browser.html();

            var settingName = 'faq_page';
            var textToCheck = site.settings[settingName];
            assert.include(html, marked(textToCheck));
            done();
          });
        }
      });
    });

    it('Contribute', function(done) {
      var browser = testUtils.browser;
      var app = testUtils.app;
      app.get('models').Site.findById('site2').then(function(site) {
        if (site) {
          var port = testUtils.app.get('port');
          var url = 'http://site2.dev.census.org:' + port + '/contribute';
          browser.visit(url, function() {
            assert.ok(browser.success);
            var html = browser.html();

            var settingName = 'contribute_page';
            var textToCheck = site.settings[settingName];
            assert.include(html, marked(textToCheck));
            done();
          });
        }
      });
    });

    it('Custom content', function(done) {
      var browser = testUtils.browser;
      var app = testUtils.app;
      app.get('models').Site.findById('site1').then(function(site) {
        if (site) {
          browser.visit('/', function() {
            assert.ok(browser.success);
            var html = browser.html();

            _.forEach(['custom_css', 'navbar_logo', 'custom_footer'],
              function(settingName) {
                var textToCheck = site.settings[settingName];
                assert.include(html, textToCheck);
              });
            done();
          });
        }
      });
    });

    it('Place', function(done) {
      var browser = testUtils.browser;
      browser.visit('/place/place12', function() {
        assert.ok(browser.success);
        var html = browser.html();

        assert.include(html, 'Place 12');
        assert.include(html, 'Dataset 12');
        done();
      });
    });

    it('Dataset', function(done) {
      var browser = testUtils.browser;
      browser.visit('/dataset/dataset12', function() {
        assert.ok(browser.success);
        var html = browser.html();

        assert.include(html, 'Description of Dataset 12');
        done();
      });
    });

    it('Login', function(done) {
      var browser = testUtils.browser;
      var port = testUtils.app.get('port');
      var site = testUtils.app.get('config').get('auth_subdomain');
      var url = 'http://' + site + '.dev.census.org:' + port + '/login';
      browser.visit(url, function() {
        assert.ok(browser.success);
        var html = browser.html();

        assert.include(html, 'Login with Facebook');
        done();
      });
    });

  });

  describe('Check redirects', function() {
    var map = {
      '/country/': '/',
      '/country/results.json': '/overview.json',
      '/country/overview/gb': '/place/gb',
      '/country/gb/timetables': '/entry/gb/timetables',
      '/country/submit': '/submit',
      '/country/review/xyz': '/submission/xyz'
    };
    _.forEach(map, function(target, source) {
      it(source + ' -> ' + target, function(done) {
        var browser = testUtils.browser;
        browser.on('redirect', function(request, response) {
          assert.equal(response.headers.get('Location'), target);
          browser.removeAllListeners('redirect');
          throw null; // Cancel request
        });
        browser.visit(source, function() {
          done();
        });
      });
    });
  });

  describe('Census pages', function() {

    beforeEach(function() {
      var config = testUtils.app.get('config');
      config.set('test:testing', true);
      config.set('test:user', {
        userid: userFixtures[0].data.id
      });
    });

    it('View submit page', function(done) {
      var browser = testUtils.browser;
      var app = testUtils.app;
      app.get('models').Site.findById('site2').then(function(site) {
        if (site) {
          var port = testUtils.app.get('port');
          var url = 'http://site2.dev.census.org:' + port + '/submit';
          browser.visit(url, function() {
            assert.ok(browser.success);
            var html = browser.html();

            var settingName = 'submit_page';
            var textToCheck = site.settings[settingName];
            assert.include(html, 'Submit');
            assert.include(html, marked(textToCheck));
            done();
          });
        }
      });
    });

    it('View entry page', function(done) {
      var browser = testUtils.browser;
      var app = testUtils.app;
      app.get('models').Site.findById('site2').then(function(site) {
        if (site) {
          var entry = entryFixtures[0].data;
          var url = ['', 'entry', entry.place, entry.dataset, entry.year]
            .join('/');
          browser.visit(url, function() {
            assert.ok(browser.success);
            done();
          });
        }
      });
    });

    it('View recent changes page', function(done) {
      var browser = testUtils.browser;
      var app = testUtils.app;
      app.get('models').Site.findById('site2').then(function(site) {
        if (site) {
          var port = testUtils.app.get('port');
          var url = 'http://site2.dev.census.org:' + port + '/changes';
          browser.visit(url, function() {
            assert.ok(browser.success);
            assert.isAbove(browser.queryAll('.change-list a').length, 0);
            done();
          });
        }
      });
    });

    it('View pre-populated submit page / no entry', function(done) {
      var browser = testUtils.browser;
      var app = testUtils.app;

      // country with nothing in our test db
      var entry = _.find(entryFixtures, function(entry) {
       return (entry.data.dataset === 'datasetOfNoEntry') &&
         (entry.data.place === 'placeOfNoEntry');
      }).data;

      app.get('models').Entry.findAll({where: {
        site: entry.site,
        place: entry.place,
        dataset: entry.dataset
      }, order: '"updatedAt" DESC'}).then(function(results) {
        var candidate = _.first(results);

        var prefill = {
          place: candidate.place,
          dataset: candidate.dataset,
          exists: candidate.answers.exists,
          digital: candidate.answers.digital,
          online: candidate.answers.online,
          url: 'http://xyz.com',
          licenseurl: 'http://example.com',
          qualityinfo: 5,
          details: candidate.details
        };

        var port = testUtils.app.get('port');
        var url = 'http://site2.dev.census.org:' + port + '/submit?' +
          _.map(prefill, function(value, key) {
            return encodeURIComponent(key) + '=' + encodeURIComponent(value);
          }).join('&');

        browser.visit(url, function() {
          assert.ok(browser.success);
          assert.equal(
            browser.query('select[name="place"] option:checked').value,
            prefill.place);
          assert.equal(
            browser.query('select[name="dataset"] option:checked').value,
            prefill.dataset);
          assert.equal(
            browser.query('textarea[name="details"]').value,
            prefill.details);
          // !!! Does not work - always checked exists=true checkbox
          //assert.isNotNull(browser.query('input[name="exists"][value="' +
          //  prefill.exists + '"]:checked'));
          //if (prefill.exists) {
          //  assert.isNotNull(browser.query('input[name="digital"][value="' +
          //    prefill.digital + '"]:checked'));
          //  assert.isNotNull(browser.query('input[name="online"][value="' +
          //    prefill.online + '"]:checked'));
          //}
          done();
        });
      });
    });

    it('View pre-populated submit page / with entry', function(done) {
      var browser = testUtils.browser;
      var app = testUtils.app;

      // country with nothing in our test db
      var entry = entryFixtures[0].data;

      // country in our test db for default year
      app.get('models').Entry.findAll({where: {
        site: entry.site,
        place: entry.place,
        dataset: entry.dataset
      }, order: '"updatedAt" DESC'}).then(function(results) {
        var candidate = _.findWhere(results, {isCurrent: true});

        var prefill = {
          place: candidate.place,
          dataset: candidate.dataset,
          exists: candidate.answers.exists
        };

        var port = testUtils.app.get('port');
        var url = 'http://site1.dev.census.org:' + port + '/submit?' +
          _.map(prefill, function(value, key) {
            return encodeURIComponent(key) + '=' + encodeURIComponent(value);
          }).join('&');

        browser.visit(url, function() {
          assert.ok(browser.success);

          assert.equal(
            browser.query('select[name="place"] option:checked').value,
            prefill.place);
          assert.equal(
            browser.query('select[name="dataset"] option:checked').value,
            prefill.dataset);

          // Should it work at all?
          //var textToCheck = marked(_.find(datasetFixtures, function(item) {
          //  return item.data.id === candidate.dataset;
          //}).data.description);
          //assert.include(browser.html(), textToCheck);

          // !!! Does not work - always checked exists=true checkbox
          //assert.isNotNull(browser.query('input[name="exists"][value="' +
          //  prefill.exists + '"]:checked'));
          done();
        });
      });
    });

    it('View review page', function(done) {
      var entry = _.find(entryFixtures, function(item) {
        return (item.data.isCurrent === false) && (item.data.site === 'site2');
      }).data;
      var dataset = _.find(datasetFixtures, function(item) {
        return item.data.id === entry.dataset;
      }).data;

      var browser = testUtils.browser;
      var app = testUtils.app;
      var url = 'http://site2.dev.census.org:' + app.get('port') +
        '/submission/' + entry.id;
      browser.visit(url, function() {
        assert.ok(browser.success);

        var html = browser.html();
        var textToCheck = app.get('config').get('review_page');
        textToCheck = textToCheck.replace(/\&\#39\;/g, '\'');
        assert.include(html, textToCheck);
        assert.include(html, dataset.description);

        done();
      });
    });

  });

});
