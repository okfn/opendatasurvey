'use strict';

var _ = require('lodash');
var assert = require('chai').assert;
var testUtils = require('./utils');
var marked = require('marked');

var entryFixtures = require('../fixtures/entry');
var datasetFixtures = require('../fixtures/dataset');
var userFixtures = require('../fixtures/user');
var questionSetFixtures = require('../fixtures/questionset');

describe('Basics', function() {
  before(testUtils.startApplication);
  after(testUtils.shutdownApplication);

  beforeEach(function() {
    this.browser = testUtils.browser;
    var port = testUtils.app.get('port');
    this.browser.site = 'http://site1.dev.census.org:' + port + '/';
    this.browser.removeAllListeners('redirect');
    this.app = testUtils.app;
  });

  this.timeout(20000);

  describe('Pages', function() {
    it('Front', function(done) {
      this.app.get('models').Site.findById('site1').then(site => {
        if (site) {
          this.browser.visit('/', () => {
            assert.ok(this.browser.success);
            var html = this.browser.html();
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
      this.app.get('models').Site.findById('site1').then(site => {
        if (site) {
          this.browser.visit('/about', () => {
            assert.ok(this.browser.success);
            var html = this.browser.html();
            var settingName = 'about_page';
            var textToCheck = site.settings[settingName];
            assert.include(html, marked(textToCheck));
            done();
          });
        }
      });
    });

    it('FAQ', function(done) {
      this.app.get('models').Site.findById('site1').then(site => {
        if (site) {
          this.browser.visit('/faq', () => {
            assert.ok(this.browser.success);
            var html = this.browser.html();
            var settingName = 'faq_page';
            var textToCheck = site.settings[settingName];
            assert.include(html, marked(textToCheck));
            done();
          });
        }
      });
    });

    it('Contribute', function(done) {
      this.app.get('models').Site.findById('site2').then(site => {
        if (site) {
          var port = this.app.get('port');
          var url = 'http://site2.dev.census.org:' + port + '/contribute';
          this.browser.visit(url, () => {
            assert.ok(this.browser.success);
            var html = this.browser.html();
            var settingName = 'contribute_page';
            var textToCheck = site.settings[settingName];
            assert.include(html, marked(textToCheck));
            done();
          });
        }
      });
    });

    it('Custom content', function(done) {
      this.app.get('models').Site.findById('site1').then(site => {
        if (site) {
          this.browser.visit('/', () => {
            assert.ok(this.browser.success);
            var html = this.browser.html();
            _.forEach(['custom_css', 'navbar_logo',
                       'custom_footer', 'support_url'],
              settingName => {
                var textToCheck = site.settings[settingName];
                assert.include(html, textToCheck);
              });
            done();
          });
        }
      });
    });

    it('Place', function(done) {
      this.browser.visit('/place/place12', () => {
        assert.ok(this.browser.success);
        var html = this.browser.html();
        assert.include(html, 'Place 12');
        assert.include(html, 'Dataset 12');
        done();
      });
    });

    it('Dataset', function(done) {
      this.browser.visit('/dataset/dataset12', () => {
        assert.ok(this.browser.success);
        var html = this.browser.html();
        assert.include(html, 'Description of Dataset 12');
        done();
      });
    });

    it('Login', function(done) {
      var port = this.app.get('port');
      var site = this.app.get('config').get('auth_subdomain');
      var url = 'http://' + site + '.dev.census.org:' + port + '/login';
      this.browser.visit(url, () => {
        assert.ok(this.browser.success);
        var html = this.browser.html();
        assert.include(html, 'Login with Facebook');
        done();
      });
    });
  });

  describe('Check redirects', function() {
    var map = {
      '/country/': '/',
      '/country/results.json': '/api/entries.json',
      '/country/overview/gb': '/place/gb',
      '/country/gb/timetables': '/entry/gb/timetables',
      '/country/submit': '/login'
    };
    _.forEach(map, (target, source) => {
      it(source + ' -> ' + target, function(done) {
        this.browser.visit(source, () => {
          this.browser.assert.redirected();
          assert.equal(target, this.browser.location.pathname);
          done();
        });
      });
    });
    it('/country/review/uuid -> /submission/uuid', function(done) {
      this.app.get('models').Entry.findOne().then(entry => {
        this.browser.visit('/country/review/' + entry.id, () => {
          this.browser.assert.redirected();
          assert.equal('/submission/' + entry.id,
            this.browser.location.pathname);
          done();
        });
      });
    });
  });

  describe('Census pages', function() {
    beforeEach(function() {
      var config = this.app.get('config');
      config.set('test:testing', true);
      config.set('test:user', {
        userid: userFixtures[1].data.id,
        emails: userFixtures[1].data.emails
      });
    });

    it('View submit page', function(done) {
      this.app.get('models').Site.findById('site2').then(site => {
        if (site) {
          var port = this.app.get('port');
          var url = 'http://site2.dev.census.org:' + port + '/submit';
          this.browser.visit(url, () => {
            assert.ok(this.browser.success);
            var html = this.browser.html();

            var settingName = 'submit_page';
            var textToCheck = site.settings[settingName];
            assert.include(html, 'Submit');
            assert.include(html, marked(textToCheck));
            done();
          });
        }
      });
    });

    it('View submit-react page contains qsSchema', function(done) {
      var port = this.app.get('port');
      var url = 'http://site2.dev.census.org:' + port +
        '/submit?place=placeOfNoEntry&dataset=datasetOfNoEntry';

      return this.browser.visit(url, () => {
        var expectedQSetSchema = _.find(questionSetFixtures, qSet => {
          return (qSet.data.site === 'site2');
        }).data.qsSchema;
        assert.ok(this.browser.success);
        this.browser.assert.evaluate('window.qsSchema', expectedQSetSchema);
        this.browser.assert.evaluate('window.qsSchema.length', 12);
        this.browser.assert.evaluate('window.qsSchema[0].id', 'exists');
        this.browser.assert.evaluate('window.qsSchema[0].ifProvider', []);
        this.browser.assert.evaluate('window.qsSchema[0].position', 0);
        done();
      });
    });

    it('View entry page', function(done) {
      this.app.get('models').Site.findById('site2').then(site => {
        if (site) {
          var entry = entryFixtures[0].data;
          var url = ['', 'entry', entry.place, entry.dataset, entry.year]
            .join('/');
          this.browser.visit(url, () => {
            assert.ok(this.browser.success);
            done();
          });
        }
      });
    });

    it('View recent changes page', function(done) {
      this.app.get('models').Site.findById('site2').then(site => {
        if (site) {
          var port = this.app.get('port');
          var url = 'http://site2.dev.census.org:' + port + '/changes';
          this.browser.visit(url, () => {
            assert.ok(this.browser.success);
            assert.isAbove(this.browser.queryAll('.change-list a').length, 0);
            done();
          });
        }
      });
    });

    it('View pre-populated submit page / no entry', function(done) {
      // country with nothing in our test db
      var entry = _.find(entryFixtures, entry => {
        return (entry.data.dataset === 'datasetOfNoEntry') &&
        (entry.data.place === 'placeOfNoEntry');
      }).data;

      this.app.get('models').Entry.findAll({where: {
        site: entry.site,
        place: entry.place,
        dataset: entry.dataset
      }, order: '"updatedAt" DESC'}).then(results => {
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

        var port = this.app.get('port');
        var url = 'http://site2.dev.census.org:' + port + '/submit?' +
          _.map(prefill, (value, key) => {
            return encodeURIComponent(key) + '=' + encodeURIComponent(value);
          }).join('&');

        this.browser.visit(url, () => {
          assert.ok(this.browser.success);
          this.browser.assert.text('header .place ul li[class="selected"] a',
                                   'Place 22 of no entry');
          this.browser.assert.text('header .dataset ul li[class="selected"] a',
                                   'Dataset 22 of no entry');
          assert.equal(
            this.browser.query('textarea[name="details"]').value,
            prefill.details);
          // !!! Does not work - always checked exists=true checkbox
          // assert.isNotNull(this.browser.query('input[name="exists"][value="' +
          //  prefill.exists + '"]:checked'));
          // if (prefill.exists) {
          //  assert.isNotNull(this.browser.query('input[name="digital"][value="' +
          //    prefill.digital + '"]:checked'));
          //  assert.isNotNull(this.browser.query('input[name="online"][value="' +
          //    prefill.online + '"]:checked'));
          // }
          done();
        });
      });
    });

    it('View pre-populated submit page / with entry', function(done) {
      // country with nothing in our test db
      var entry = entryFixtures[0].data;

      // country in our test db for default year
      this.app.get('models').Entry.findAll({where: {
        site: entry.site,
        place: entry.place,
        dataset: entry.dataset
      }, order: '"updatedAt" DESC'}).then(results => {
        var candidate = _.findWhere(results, {isCurrent: true});

        var prefill = {
          place: candidate.place,
          dataset: candidate.dataset,
          exists: candidate.answers.exists
        };

        var port = this.app.get('port');
        var url = 'http://site1.dev.census.org:' + port + '/submit?' +
          _.map(prefill, (value, key) => {
            return encodeURIComponent(key) + '=' + encodeURIComponent(value);
          }).join('&');

        this.browser.visit(url, () => {
          assert.ok(this.browser.success);
          this.browser.assert.text('header .place ul li[class="selected"] a',
                                   'Place 12');
          this.browser.assert.text('header .dataset ul li[class="selected"] a',
                                   'Dataset 11');
          // Should it work at all?
          // var textToCheck = marked(_.find(datasetFixtures, function(item) {
          //  return item.data.id === candidate.dataset;
          // }).data.description);
          // assert.include(this.browser.html(), textToCheck);

          // !!! Does not work - always checked exists=true checkbox
          // assert.isNotNull(this.browser.query('input[name="exists"][value="' +
          //  prefill.exists + '"]:checked'));
          done();
        });
      });
    });

    it('View review page', function(done) {
      var entry = _.find(entryFixtures, item => {
        return (item.data.isCurrent === false) && (item.data.site === 'site2');
      }).data;
      var dataset = _.find(datasetFixtures, item => {
        return item.data.id === entry.dataset;
      }).data;

      var url = 'http://site2.dev.census.org:' + this.app.get('port') +
        '/submission/' + entry.id;
      this.browser.visit(url, () => {
        assert.ok(this.browser.success);
        var html = this.browser.html();
        var textToCheck = this.app.get('config').get('review_page');
        textToCheck = textToCheck.replace(/&#39;/g, '\'');
        assert.include(html, textToCheck);
        assert.include(html, dataset.description);

        done();
      });
    });
  });
});
