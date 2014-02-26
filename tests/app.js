var request = require('supertest')
  , passport = require('passport')
  , assert = require('assert')
  , config = require('../lib/config.js')
  // importing base sets the test db
  , base = require('./base.js')
  ;

config.set('test:testing', true);
// config.set('appconfig:port', 5001 + Math.floor(Math.random() * 1000));

// only require after setting config ...
var model = require('../lib/model.js').OpenDataCensus;

var app = require('../app.js').app;

describe('Basics', function() {
  before(function(done) {
    base.setFixtures();
    model.load(function() {
      done();
    });
  });
  after(function(done) {
    base.unsetFixtures();
    done();
  });
  it('front page works', function(done) {
    request(app)
      .get('/')
      .expect(200)
      .end(function(err, res) {
        checkContent(res, config.get('overview_page'));
        // check overview table works
        checkContent(res, 'United Kingdom');
        checkContent(res, 'Zambia');
        done();
      })
      ;
  });
  it('about page ok', function(done) {
    request(app)
      .get('/about')
      .expect(200)
      .end(function(err, res) {
        checkContent(res, config.get('about_page'));
        done();
      })
      ;
  });
  it('faq page ok', function(done) {
    request(app)
      .get('/faq')
      .expect(200)
      .end(function(err, res) {
        checkContent(res, config.get('faq_page'));
        done();
      })
      ;
  });
  it('contribute page ok', function(done) {
    request(app)
      .get('/contribute')
      .expect(200)
      .end(function(err, res) {
        checkContent(res, config.get('contribute_page'));
        done();
      })
      ;
  });
  it('custom content works', function(done) {
    request(app)
      .get('/')
      .expect(200)
      .end(function(err, res) {
        checkContent(res, config.get('custom_css'));
        checkContent(res, config.get('custom_footer'));
        checkContent(res, config.get('google_analytics_key'));
        checkContent(res, config.get('navbar_logo'));
        done();
      })
      ;
  });

  // ========================
  // More complex pages

  it('place page works', function(done) {
    request(app)
      .get('/place/gb')
      .expect(200)
      .end(function(err, res) {
        assert(res.text.match('/ United Kingdom'), 'Place name not present');
        assert(res.text.match('Transport Timetables'), 'Dataset list missing');
        done();
      })
      ;
  });
  it('dataset page works', function(done) {
    request(app)
      .get('/dataset/timetables')
      .expect(200)
      .end(function(err, res) {
        assert(res.text.match('/ Transport Timetables'), 'Dataset name not present');
        done();
      })
      ;
  });
  it('login works', function(done) {
    request(app)
      .get('/login')
      .expect(200)
      .end(function(err, res) {
        assert(res.text.match('Login with Facebook'));
        done();
      });
      ;
  });

  // test redirects
  testRedirect('/country/', '/');
  testRedirect('/country/results.json', '/overview.json');
  testRedirect('/country/overview/gb', '/place/gb');
  testRedirect('/country/gb/timetables', '/entry/gb/timetables');
  testRedirect('/country/submit', '/submit');
  testRedirect('/country/review/xyz', '/submission/xyz');
});

function checkContent(res, expected) {
  var found = res.text.match(expected)
  if (!found) {
    // console.log(res.text);
    assert(false, '<<' + expected + '>> not found in page');
  }
}

function testRedirect(src, dest) {
  it('redirect from ' + src + ' to ' + dest, function(done) {
    request(app)
      .get(src)
      .expect(302)
      .end(function(err, res) {
        if (err) return done(err);
        assert.equal(res.header['location'], dest);
        done();
      })
      ;
  });
};

describe('Permissions', function() {
  this.timeout(base.TIMEOUT);

  // cache for later
  var testuser = config.get('test:user');

  before(function(done) {
    base.setFixtures();
    model.load(function() {
      model.backend.login(function(err){
        done(err);
      });
    });
  });
  after(function(done) {
    config.set('test:user', testuser);
    base.unsetFixtures();
    done();
  });
  it('requires login for submit', function(done) {
    config.set('test:testing', false);
    request(app)
      .get('/submit')
      .end(function(err, res) {
        if (err) return done(err);
        config.set('test:testing', true);
        assert.equal(res.headers['location'], '/login/?next=%2Fsubmit');
        done();
      });
  });
  it('Anonymous review has no buttons', function(done) {
    config.set('test:testing', false);
    request(app)
      .get('/submission/testid-1')
      .expect(200)
      .end(function(err, res) {
        if (err) return done(err);
        config.set('test:testing', true);
        assert(res.text.indexOf('<button') < 0, 'button found');
        assert(res.text.indexOf('<form') < 0, 'form found');
        done();
      });
  });
  it('Non-reviewer cannot review', function(done) {
    config.set('test:user', {userid: 'jones'});
    request(app)
      .get('/submission/testid-1')
      .expect(200)
      .end(function(err, res) {
        if (err) return done(err);

        assert(res.text.indexOf('<button') < 0, 'button found');
        assert(res.text.indexOf('<form') < 0, 'form found');
        done();
      });
  });
  it('405s is anon login without anonymous_submissions: true', function(done) {
    config.set('anonymous_submissions', 'FALSE');
    config.set('test:testing', false);
    request(app)
      .post('/login/?next=%2Fsubmit%2F')
      .send({ displayName: 'xxx'})
      .expect(405)
      .end(function(err, res) {
        config.set('test:testing', true);
        config.set('anonymous_submissions', 'TRUE');
        done(err);
      });
  });
  it('user serialized after posting to login', function(done) {
    var agent = request(app),
        serializedUser;
    // duplicated code to serializeUser to make passport work ...
    passport.serializeUser(function(user, done) {
      serializedUser = user;
      done(null, user);
    });
    config.set('test:testing', false);
    agent
      .post('/login/?next=%2Fsubmit%2F')
      .send({ displayName: 'xxx'})
      .expect(302)
      .end(function(err, res) {
        config.set('test:testing', true);
        if (err) return done(err);
        assert.equal(serializedUser.name, 'xxx');
        assert.equal(res.headers.location, '/submit/');
        done();
      });
  });
});

describe('Census Pages', function() {
  this.timeout(base.LONG_TIMEOUT);
  var fixSubmission = {
    submissionid: 'test-created-1',
    place: 'af',
    year: '2013',
    dataset: 'timetables',
    exists: 'Yes'
  };
  before(function(done) {
    base.setFixtures();
    model.load(function() {
      model.backend.login(function(err){
        if (err) {
          done(err);
          return;
        }
        model.backend.insertSubmission(fixSubmission, null, done);
      });
    });
  });
  after(function(done) {
    base.unsetFixtures();
    model.backend.deleteAll(model.backend.options.submissionIndex, {place: 'de'}, complete);
    model.backend.deleteAll(model.backend.options.submissionIndex, {place: 'af'}, complete);
    model.backend.deleteAll(model.backend.options.entryIndex, {place: 'af'}, complete);
    var count = 3;
    function complete() {
      count--;
      if (count === 0) done();
    }
  });

  it('GET Submit', function(done) {
    request(app)
      .get('/submit/')
      .expect(200)
      .end(function(err, res) {
        assert(res.text.match('Submit'));
        checkContent(res, config.get('submit_page'));
        done();
      });
  });

  it('GET Entry', function(done) {
    request(app)
      .get('/entry/gb/timetables')
      .expect(200, done)
      ;
  });

  function testRadio(text, name, value) {
    var exp = 'name="%name" value="%value" checked="true"'
      .replace('%name', name)
      .replace('%value', value)
      ;
    assert(text.match(exp), 'Not checked: ' + name + ' ' + value);
  }

  it('GET Submission with pre-populated no entry', function(done) {
    var prefill = {
      // country with nothing in our test db ...
        place: 'ug'
      , dataset: 'emissions'
      , exists: 'Yes'
      , digital: 'Unsure'
      , online: 'No'
      , url: 'http://xyz.com'
      , licenseurl: 'http://abc.com'
      , qualityinfo: 5
      , details: 'Lots of random stuff\n\nincluding line breaks'
    };
    request(app)
      .get('/submit/')
      .query(prefill)
      .expect(200)
      .end(function(err, res) {
        assert(!err);
        // all test regex tests are rather hacky ...
        assert(res.text.match('value="%s" selected="true"'.replace('%s', prefill.place)), 'place not set');
        assert(res.text.match('value="emissions" selected="true"'), 'dataset not set');
        debugger;
        testRadio(res.text, 'exists', prefill.exists);
        testRadio(res.text, 'digital', prefill.digital);
        testRadio(res.text, 'online', prefill.online);
        assert(res.text.match('name="url" value="' + prefill.url + '"'), 'url not set');
        assert(res.text.match('name="licenseurl" value="' + prefill.licenseurl + '"'), 'license url not set');
        assert(res.text.match('value="5" selected="true"'), 'quality info not set');
        assert(res.text.match(prefill.details + '</textarea>'), 'details not set');
        done();
      });
  });

  it('GET Submission pre-populated with entry', function(done) {
    var prefill = {
      // country in our test db for default year
        place: 'gb'
      , dataset: 'maps'
    };
    var url = 'http://www.ordnancesurvey.co.uk/opendata/';
    request(app)
      .get('/submit/')
      .query(prefill)
      .expect(200)
      .end(function(err, res) {
        assert(!err);
        // all test regex tests are rather hacky ...
        assert(res.text.match('value="%s" selected="true"'.replace('%s', prefill.place)), 'place not set');
        testRadio(res.text, 'exists', 'Yes');
        testRadio(res.text, 'openlicense', 'No');
        assert(res.text.match('name="url" value="' + url + '"'), 'url not set');
        done();
      });
  });

  it('POST Submission', function(done) {
    var testString = 'Text including 2 line\n\nbreaks';
    request(app)
      .post('/submit/')
      .type('form')
      .field('year', '2014')
      .field('dataset', 'timetables')
      .field('place', 'de')
      .field('exists', 'No')
      .field('details', testString)
      .expect(302)
      .end(function(err, res) {
        assert.equal(res.header['location'], '/place/de');
        model.backend.getSubmissions({place: 'de', dataset: 'timetables'}, function(err, rows) {
          assert.equal(rows.length, 1);
          // test user
          assert.equal(rows[0].submitter, config.get('test:user').name);
          assert.equal(rows[0].submitterid, config.get('test:user').userid);
          assert.equal(rows[0].details, testString);
          done();
        });
      });
  });

  it('GET review', function(done) {
    var url = '/submission/2948d308-ce1c-46fb-b131-dc0f846da788';
    request(app)
      .get(url)
      .expect(200)
      .end(function(err, res) {
        checkContent(res, config.get('review_page'));
        assert(res.text.match('Publish will overwrite the whole current entry'), 'on review page');
        assert(res.text.match('National government budget at a high level'), 'correct dataset shows up');
        done();
      });
  });

  it('POST review', function(done) {
    var url = '/submission/' + fixSubmission.submissionid;
    request(app)
      .post(url)
      .type('form')
      .field('submit', 'Publish')
      .expect(302)
      .end(function(err, res) {
        if (err) return done(err);
        assert.equal(res.header['location'], '/');
        model.backend.getSubmission(fixSubmission, function(err, sub) {
          assert.equal(sub.reviewer, config.get('test:user').name);
          assert.equal(sub.reviewerid, config.get('test:user').userid);
          assert.equal(sub.reviewresult, 'accepted');
          assert.equal(sub.reviewed, '1');
          done();
        });
      });
  });
});

