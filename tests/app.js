var request = require('supertest-as-promised')
  , passport = require('passport')
  , chai = require('chai')
  , app = require('../census/app.js').app
  , assert = chai.assert
  , marked = require('marked')
  , models = require('../census/models')
  , config = require('../census/config')
  // importing base sets the test db
  , base = require('./base.js')
  ;

config.set('test:testing', true);
// config.set('appconfig:port', 5001 + Math.floor(Math.random() * 1000));

describe('Basics', function() {
  it('front page works', function(done) {
    request(app)
      .get('/')
      .set('Host', 'national.dev.census.org')
      .expect(200)
      .then(function(res) {
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
      .set('Host', 'national.dev.census.org')
      .expect(200)
      .then(function(res) {
        models.Site.findById('national').then(function(R) {
          checkContent(res, marked(R.settings.about_page));
          done();
        });
      });
  });
  it('faq page ok', function(done) {
    request(app)
      .get('/faq')
      .set('Host', 'national.dev.census.org')
      .expect(200)
      .then(function(res) {
        models.Site.findById('national').then(function(R) {
          checkContent(res, marked(R.settings.faq_page));
          done();
        });
      })
      ;
  });
  it('contribute page ok', function(done) {
    request(app)
      .get('/contribute')
      .set('Host', 'national.dev.census.org')
      .expect(200)
      .then(function(res) {
        models.Site.findById('national').then(function(R) {
          checkContent(res, marked(R.settings.contribute_page));
          done();
        });
      })
      ;
  });
  it('custom content works', function(done) {
    request(app)
      .get('/')
      .set('Host', 'national.dev.census.org')
      .expect(200)
      .then(function(res) {
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
      .set('Host', 'national.dev.census.org')
      .expect(200)
      .then(function(res) {
        checkContent(res, 'United Kingdom /', 'Place name not present');
        checkContent(res, 'Transport Timetables', 'Dataset list missing');
        done();
      })
      ;
  });
  it('dataset page works', function(done) {
    request(app)
      .get('/dataset/timetables')
      .set('Host', 'national.dev.census.org')
      .expect(200)
      .then(function(res) {
        checkContent(res, '/ Transport Timetables', 'Dataset name not present');
        done();
      })
      ;
  });
  it('login works', function(done) {
    request(app)
      .get('/login')
      .set('Host', config.get('auth_subdomain') + '.dev.census.org')
      .expect(200)
      .then(function(res) {
        checkContent(res, 'Login with Facebook');
        done();
      });
      ;
  });
  it('API json works', function(done) {
    request(app)
      .get('/api/entries.json')
      .set('Host', 'national.dev.census.org')
      .expect(200)
      .then(function(res) {
        // check a random snippet of json
        checkContent(res, '"url":"http://www.efv.admin.ch/f/dokumentation/finanzberichterstattung/staatsrechnungen.php",');
        done();
      })
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

function checkContent(res, expected, errMsg) {
  if (!errMsg) {
    errMsg = '<<' + expected + '>> not found in page';
  }
  var found = escape(res.text).match(escape((expected || '')));
  if (!found) {
    assert(false, errMsg);
  }
}

function testRedirect(src, dest) {
  it('redirect from ' + src + ' to ' + dest, function(done) {
    request(app)
      .get(src)
      .set('Host', 'national.dev.census.org')
      .expect(302)
      .then(function(res) {
        assert.equal(res.header['location'].replace('/subdomain/:domain', ''), dest);
        done();
      })
      ;
  });
};

// describe('Permissions', function() {
//   this.timeout(base.TIMEOUT);

//   // cache for later
//   var testuser = config.get('test:user');

//   before(function(done) {
//     base.setFixtures();
//     model.load(function() {
//       model.backend.login(function(err){
//         done(err);
//       });
//     });
//   });
//   after(function(done) {
//     config.set('test:user', testuser);
//     base.unsetFixtures();
//     done();
//   });
//   it('requires login for submit', function(done) {
//     config.set('test:testing', false);
//     request(app)
//       .get('/submit')
//       .end(function(err, res) {
//         if (err) return done(err);
//         config.set('test:testing', true);
//         assert.equal(res.headers['location'], '/login/?next=%2Fsubmit');
//         done();
//       });
//   });
//   it('Anonymous review has no buttons', function(done) {
//     config.set('test:testing', false);
//     request(app)
//       .get('/submission/testid-1')
//       .expect(200)
//       .end(function(err, res) {
//         if (err) return done(err);
//         config.set('test:testing', true);
//         assert(res.text.indexOf('<button') < 0, 'button found');
//         assert(res.text.indexOf('<form') < 0, 'form found');
//         done();
//       });
//   });
//   it('Non-reviewer cannot review', function(done) {
//     config.set('test:user', {userid: 'jones'});
//     request(app)
//       .get('/submission/testid-1')
//       .expect(200)
//       .end(function(err, res) {
//         if (err) return done(err);

//         assert(res.text.indexOf('<button') < 0, 'button found');
//         assert(res.text.indexOf('<form') < 0, 'form found');
//         done();
//       });
//   });
//   it('405s is anon login without anonymous_submissions: true', function(done) {
//     config.set('anonymous_submissions', 'FALSE');
//     config.set('test:testing', false);
//     request(app)
//       .post('/login/?next=%2Fsubmit%2F')
//       .send({ displayName: 'xxx'})
//       .expect(405)
//       .end(function(err, res) {
//         config.set('test:testing', true);
//         config.set('anonymous_submissions', 'TRUE');
//         done(err);
//       });
//   });
//   it('user serialized after posting to login', function(done) {
//     var agent = request(app),
//         serializedUser;
//     // duplicated code to serializeUser to make passport work ...
//     passport.serializeUser(function(user, done) {
//       serializedUser = user;
//       done(null, user);
//     });
//     config.set('test:testing', false);
//     agent
//       .post('/login/?next=%2Fsubmit%2F')
//       .send({ displayName: 'xxx'})
//       .expect(302)
//       .end(function(err, res) {
//         config.set('test:testing', true);
//         if (err) return done(err);
//         assert.equal(serializedUser.name, 'xxx');
//         assert.equal(res.headers.location, '/submit/');
//         done();
//       });
//   });
// });

// describe('Census Pages', function() {
//   this.timeout(base.LONG_TIMEOUT);
//   var fixSubmission = {
//     submissionid: 'test-created-1',
//     place: 'af',
//     year: config.get('submit_year'),
//     dataset: 'timetables',
//     exists: 'Yes'
//   };
//   before(function(done) {
//     base.setFixtures();
//     model.load(function() {
//       model.backend.login(function(err){
//         if (err) {
//           done(err);
//           return;
//         }
//         model.backend.insertSubmission(fixSubmission, null, done);
//       });
//     });
//   });
//   after(function(done) {
//     base.unsetFixtures();
//     model.backend.deleteAll(model.backend.options.submissionIndex, {place: 'de'}, complete);
//     model.backend.deleteAll(model.backend.options.submissionIndex, {place: 'af'}, complete);
//     model.backend.deleteAll(model.backend.options.entryIndex, {place: 'af'}, complete);
//     var count = 3;
//     function complete() {
//       count--;
//       if (count === 0) done();
//     }
//   });

//   it('GET Submit', function(done) {
//     request(app)
//       .get('/submit/')
//       .expect(200)
//       .end(function(err, res) {
//         checkContent(res, 'Submit');
//         checkContent(res, config.get('submit_page'));
//         done();
//       });
//   });

//   it('GET Entry', function(done) {
//     request(app)
//       .get('/entry/gb/timetables')
//       .expect(200, done)
//       ;
//   });

//   it('GET recent changes page', function(done) {
//     request(app)
//       .get('/changes')
//       .expect(200)
//       .end(function(err, res) {
//         checkContent(res, '2948d308-ce1c-46fb-b131-dc0f846da788', 'Page should include a link to a submission.');
//         // ARGGGH
//         // checkContent(res, '/entry/af/timetables', 'Page should include a link to a recent entry.');
//         done();
//       });
//   });

//   function testRadio(text, name, value) {
//     var exp = 'name="%name" value="%value" checked="true"'
//       .replace('%name', name)
//       .replace('%value', value)
//       ;

//     assert(text.match(exp), 'Not checked: ' + name + ' ' + value);
//   }

//   it('GET Submission with pre-populated no entry', function(done) {
//     var prefill = {
//       // country with nothing in our test db ...
//         place: 'ug'
//       , dataset: 'emissions'
//       , exists: 'Yes'
//       , digital: 'Unsure'
//       , online: 'Yes'
//       , url: 'http://xyz.com'
//       , licenseurl: 'http://abc.com'
//       , qualityinfo: 5
//       , details: 'Lots of random stuff\n\nincluding line breaks'
//     };
//     request(app)
//       .get('/submit/')
//       .query(prefill)
//       .expect(200)
//       .end(function(err, res) {
//         assert(!err);
//         // all test regex tests are rather hacky ...
//         checkContent(res, 'value="%s" selected="true"'.replace('%s', prefill.place), 'place not set');
//         checkContent(res, 'value="emissions" selected="true"', 'dataset not set');
//         testRadio(res.text, 'exists', prefill.exists);
//         testRadio(res.text, 'digital', prefill.digital);
//         testRadio(res.text, 'online', prefill.online);
//         // REMOVED AS THESE FIELDS DEPEND ON UI INTERACTIONS
//         // checkContent(res, 'name="url" value="' + prefill.url + '"', 'url not set');
//         // checkContent(res, 'name="licenseurl" value="' + prefill.licenseurl + '"', 'license url not set');
//         checkContent(res, prefill.details + '</textarea>', 'details not set');
//         done();
//       });
//   });

//   it('GET Submission pre-populated with entry', function(done) {
//     var prefill = {
//       // country in our test db for default year
//         place: 'gb'
//       , dataset: 'maps'
//     };
//     var url = 'http://www.ordnancesurvey.co.uk/opendata/';
//     request(app)
//       .get('/submit/')
//       .query(prefill)
//       .expect(200)
//       .end(function(err, res) {
//         assert(!err);
//         // all test regex tests are rather hacky ...
//         checkContent(res, 'value="%s" selected="true"'.replace('%s', prefill.place), 'place not set');
//         checkContent(res, '<em>national-level</em>', 'Dataset description not parsed as markdown');
//         testRadio(res.text, 'exists', 'Yes');
//         testRadio(res.text, 'openlicense', 'No');
//         // REMOVED AS THESE FIELDS DEPEND ON UI INTERACTIONS
//         // checkContent(res, 'name="url" value="' + url + '"', 'url not set');
//         done();
//       });
//   });

//   it('POST Submission', function(done) {
//     var testString = 'Text including 2 line\n\nbreaks';
//     request(app)
//       .post('/submit/')
//       .type('form')
//       .field('year', config.get('submit_year'))
//       .field('dataset', 'timetables')
//       .field('place', 'de')
//       .field('exists', 'Yes')
//       .field('digital', 'Yes')
//       .field('public', 'Yes')
//       .field('free', 'Yes')
//       .field('online', 'Yes')
//       .field('officialtitle', 'The Title')
//       .field('url', 'http://www.url.com')
//       .field('machinereadable', 'Yes')
//       .field('bulk', 'Yes')
//       .field('openlicense', 'Yes')
//       .field('uptodate', 'Yes')
//       .field('details', testString)
//       .expect(302)
//       .end(function(err, res) {
//         model.backend.getSubmissions({place: 'de', dataset: 'timetables'}, function(err, rows) {
//           // test user
//           assert.equal(rows[0].submitter, config.get('test:user').name);
//           assert.equal(rows[0].submitterid, config.get('test:user').userid);
//           assert.equal(rows[0].details, testString);
//           assert.equal(rows[0].exists, 'Yes');
//           assert.equal(rows[0].online, 'Yes');
//           assert.equal(rows[0].officialtitle, 'The Title');
//           assert.equal(rows[0].url, 'http://www.url.com');
//           assert.include(res.header['location'],
//                          '/submission/ID'.replace('ID', rows[0].submissionid));
//           done();
//         });
//       });
//   });

//   it('GET review', function(done) {
//     var url = '/submission/2948d308-ce1c-46fb-b131-dc0f846da788';
//     request(app)
//       .get(url)
//       .expect(200)
//       .end(function(err, res) {
//         checkContent(res, config.get('review_page'));
//         checkContent(res, 'Publish will overwrite the whole current entry', 'on review page');
//         checkContent(res, 'National government budget at a high level', 'correct dataset shows up');
//         done();
//       });
//   });

//   it('POST review', function(done) {
//     var url = '/submission/' + fixSubmission.submissionid;
//     request(app)
//       .post(url)
//       .type('form')
//       .field('submit', 'Publish')
//       .expect(302)
//       .end(function(err, res) {
//         if (err) return done(err);
//         assert.equal(res.header['location'], '/');
//         model.backend.getSubmission(fixSubmission, function(err, sub) {
//           assert.equal(sub.reviewer, config.get('test:user').name);
//           assert.equal(sub.reviewerid, config.get('test:user').userid);
//           assert.equal(sub.reviewresult, 'accepted');
//           assert.equal(sub.reviewed, '1');
//           done();
//         });
//       });
//   });

//     it('Form validation correct not exists', function(done) {
//         request(app)
//             .post('/submit/')
//             .type('form')
//             .field('year', config.get('submit_year'))
//             .field('dataset', 'timetables')
//             .field('place', 'ar')
//             .field('exists', 'No')
//             .expect(302).end(function(err, res) {
//                 if (err) {
//                     return done(err);
//                 }
//                 return done();
//             });
//     });

//     it('Form validation incorrect no dataset', function(done) {
//         request(app)
//             .post('/submit/')
//             .type('form')
//             .field('year', config.get('submit_year'))
//             .field('dataset', '')
//             .field('place', 'ar')
//             .field('exists', 'Yes')
//             .expect(400).end(function(err, res) {
//                 if (err) {
//                     return done(err);
//                 }
//                 return done();
//             });
//     });

//     it('Form validation incorrect no place', function(done) {
//         request(app)
//             .post('/submit/')
//             .type('form')
//             .field('year', config.get('submit_year'))
//             .field('dataset', 'timetables')
//             .field('place', '')
//             .field('exists', 'Yes')
//             .expect(400).end(function(err, res) {
//                 if (err) {
//                     return done(err);
//                 }
//                 return done();
//             });
//     });

//     it('Form validation incorrect no exists', function(done) {
//         request(app)
//             .post('/submit/')
//             .type('form')
//             .field('year', config.get('submit_year'))
//             .field('dataset', 'timetables')
//             .field('place', 'ar')
//             .field('exists', '')
//             .expect(400).end(function(err, res) {
//                 if (err) {
//                     return done(err);
//                 }
//                 return done();
//             });
//     });

//     it('Form validation correct and exists', function(done) {
//         request(app)
//             .post('/submit/')
//             .type('form')
//             .field('year', config.get('submit_year'))
//             .field('dataset', 'timetables')
//             .field('place', 'ar')
//             .field('exists', 'Yes')
//             .field('digital', 'Yes')
//             .field('public', 'Yes')
//             .field('free', 'Yes')
//             .field('online', 'Yes')
//             .field('machinereadable', 'Yes')
//             .field('bulk', 'Yes')
//             .field('openlicense', 'Yes')
//             .field('uptodate', 'Yes')
//             .expect(302).end(function(err, res) {
//                 if (err) {
//                     return done(err);
//                 }
//                 return done();
//             });
//     });

//     it('Form validation incorrect and exists (empty digital)', function(done) {
//         request(app)
//             .post('/submit/')
//             .type('form')
//             .field('year', config.get('submit_year'))
//             .field('dataset', 'timetables')
//             .field('place', 'ar')
//             .field('exists', 'Yes')
//             .field('digital', '')
//             .field('public', 'Yes')
//             .field('free', 'Yes')
//             .field('online', 'Yes')
//             .field('machinereadable', 'Yes')
//             .field('bulk', 'Yes')
//             .field('openlicense', 'Yes')
//             .field('uptodate', 'Yes')
//             .expect(400).end(function(err, res) {
//                 if (err) {
//                     return done(err);
//                 }
//                 return done();
//             });
//     });

// });
