// var _ = require('lodash')
//   ,request = require('supertest-as-promised')
//   , passport = require('passport')
//   , chai = require('chai')
//   , datasetFixtures = require('../fixtures/dataset')
//   , entryFixtures = require('../fixtures/entry')
//   , userFixtures = require('../fixtures/user')
//   , app = require('../census/app.js').app
//   , assert = chai.assert
//   , marked = require('marked')
//   , models = require('../census/models')
//   , config = require('../census/config')
//   , utils = require('./utils')
//   ;


// describe('Basics', function() {

//   // Apply fixtures before each test to prevent uniqueness conflicts with app DB sync
//   beforeEach(utils.setupFixtures);
//   afterEach(utils.dropFixtures);

//   it('front page works', function(done) {
//     request(app)
//       .get('/')
//       .set('Host', 'site1.dev.census.org')
//       .expect(200)
//       .then(function(res) {
//         checkContent(res, config.get('overview_page'));
//         // check overview table works
//         checkContent(res, 'Place 11');
//         checkContent(res, 'Place 12');
//         done();
//       })
//       ;
//   });
//   it('about page ok', function(done) {
//     request(app)
//       .get('/about')
//       .set('Host', 'site1.dev.census.org')
//       .expect(200)
//       .then(function(res) {
//         models.Site.findById('site1').then(function(R) {
//           checkContent(res, marked(R.settings.about_page));
//           done();
//         });
//       });
//   });
//   it('faq page ok', function(done) {
//     request(app)
//       .get('/faq')
//       .set('Host', 'site1.dev.census.org')
//       .expect(200)
//       .then(function(res) {
//         models.Site.findById('site1').then(function(R) {
//           checkContent(res, marked(R.settings.faq_page));
//           done();
//         });
//       })
//       ;
//   });
//   it('contribute page ok', function(done) {
//     request(app)
//       .get('/contribute')
//       .set('Host', 'site2.dev.census.org')
//       .expect(200)
//       .then(function(res) {
//         models.Site.findById('site2').then(function(R) {
//           checkContent(res, marked(R.settings.contribute_page));
//           done();
//         });
//       })
//       ;
//   });
//   it('custom content works', function(done) {
//     request(app)
//       .get('/')
//       .set('Host', 'site2.dev.census.org')
//       .expect(200)
//       .then(function(res) {
//         checkContent(res, config.get('custom_css'));
//         checkContent(res, config.get('custom_footer'));
//         checkContent(res, config.get('google_analytics_key'));
//         checkContent(res, config.get('navbar_logo'));
//         done();
//       })
//       ;
//   });

//   // ========================
//   // More complex pages

//   it('place page works', function(done) {
//     request(app)
//       .get('/place/place21')
//       .set('Host', 'site2.dev.census.org')
//       .expect(200)
//       .then(function(res) {
//         checkContent(res, 'Place 21 /', 'Place name not present');
//         checkContent(res, 'Dataset 21', 'Dataset list missing');
//         done();
//       })
//       ;
//   });
//   it('dataset page works', function(done) {
//     request(app)
//       .get('/dataset/dataset21')
//       .set('Host', 'site2.dev.census.org')
//       .expect(200)
//       .then(function(res) {
//         checkContent(res, 'Description of Dataset 21', 'Dataset name not present');
//         done();
//       })
//       ;
//   });
//   it('login works', function(done) {
//     request(app)
//       .get('/login')
//       .set('Host', config.get('auth_subdomain') + '.dev.census.org')
//       .expect(200)
//       .then(function(res) {
//         checkContent(res, 'Login with Facebook');
//         done();
//       });
//       ;
//   });
//   it('API json works', function(done) {
//     request(app)
//       .get('/api/entries.json')
//       .set('Host', 'site1.dev.census.org')
//       .expect(200)
//       .then(function(res) {
//         // check a random snippet of json
//         checkContent(res, '"details":"This is site1 entry",');
//         done();
//       })
//       ;
//   });

//   // test redirects
//   testRedirect('/country/', '/');
//   testRedirect('/country/results.json', '/overview.json');
//   testRedirect('/country/overview/gb', '/place/gb');
//   testRedirect('/country/gb/timetables', '/entry/gb/timetables');
//   testRedirect('/country/submit', '/submit');
//   testRedirect('/country/review/xyz', '/submission/xyz');
// });

// function checkContent(res, expected, errMsg) {
//   if (!errMsg) {
//     errMsg = '<<' + expected + '>> not found in page';
//   }
//   var found = escape(res.text).match(escape((expected || '')));
//   if (!found) {
//     assert(false, errMsg);
//   }
// }

// function testRedirect(src, dest) {
//   it('redirect from ' + src + ' to ' + dest, function(done) {
//     request(app)
//       .get(src)
//       .set('Host', 'site1.dev.census.org')
//       .expect(302)
//       .then(function(res) {
//         assert.equal(res.header['location'].replace('/subdomain/:domain', ''), dest);
//         done();
//       })
//       ;
//   });
// };


// describe('Census Pages', function() {

//   beforeEach(utils.setupFixtures);
//   afterEach(utils.dropFixtures);

//   var fixSubmission = {
//     submissionid: 'test-created-1',
//     place: 'af',
//     year: config.get('submit_year'),
//     dataset: 'timetables',
//     exists: 'Yes'
//   };

//   it('GET Submit', function(done) {
//     config.set('test:user', {userid: userFixtures[0].data.id});

//     request(app)
//       .get('/census/submit')
//       .set('Host', 'site2.dev.census.org')
//       .expect(200)
//       .then(function(res) {
//         models.Site.findById('site2').then(function(R) {
//           checkContent(res, 'Submit');
//           checkContent(res, marked(R.settings.submit_page));
//           done();
//         });
//       });
//   });

//   it('GET Entry', function(done) {
//     var entry = entryFixtures[0].data;


//     config.set('test:user', {userid: userFixtures[0].data.id});

//     request(app)
//       .get(['', 'entry', entry.place, entry.dataset, entry.year].join('/'))
//       .set('Host', 'site1.dev.census.org')
//       .expect(200, done)
//       ;
//   });

//   it('GET recent changes page', function(done) {
//     request(app)
//       .get('/changes')
//       .set('Host', 'site2.dev.census.org')
//       .expect(200)
//       .then(function(res) {
//         checkContent(
//           res,
//           _.find(entryFixtures, function(E) { return E.isCurrent === false && site === 'site2' }),
//           'Page should include a link to a submission.'
//         );

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
//     var entry = _.find(entryFixtures, function(E) {
//       return E.data.dataset === 'datasetOfNoEntry' && E.data.place === 'placeOfNoEntry';
//     }).data;

//     models.Entry.findAll({where: {
//       site: entry.site,
//       place: entry.place,
//       dataset: entry.dataset
//     }, order: '"updatedAt" DESC'}).then(function(R) {
//       var candidate = _.first(R);

//       var prefill = {
//         // country with nothing in our test db ...
//           place: candidate.place
//         , dataset: candidate.dataset
//         , exists: candidate.answers.exists
//         , digital: candidate.answers.digital
//         , online: candidate.answers.online
//         , url: 'http://xyz.com'
//         , licenseurl: 'http://example.com'
//         , qualityinfo: 5
//         , details: candidate.details
//       };


//       config.set('test:user', {userid: userFixtures[0].data.id});

//       request(app)
//         .get('/census/submit/')
//         .set('Host', 'site2.dev.census.org')
//         .query(prefill)
//         .expect(200)
//         .then(function(res) {
//           // all test regex tests are rather hacky ...
//           checkContent(res, 'value="%s" selected='.replace('%s', prefill.place), 'place not set');
//           checkContent(res, 'value="' + prefill.dataset + '" selected="true"', 'dataset not set');
//           testRadio(res.text, 'exists', prefill.exists);
//           testRadio(res.text, 'digital', prefill.digital);
//           testRadio(res.text, 'online', prefill.online);
//           // REMOVED AS THESE FIELDS DEPEND ON UI INTERACTIONS
//           // checkContent(res, 'name="url" value="' + prefill.url + '"', 'url not set');
//           // checkContent(res, 'name="licenseurl" value="' + prefill.licenseurl + '"', 'license url not set');
//           checkContent(res, prefill.details + '</textarea>', 'details not set');
//           done();
//         });
//     });
//   });

//   it('GET Submission pre-populated with entry', function(done) {
//     var entry = entryFixtures[0].data;

//     models.Entry.findAll({where: {
//       site: entry.site,
//       place: entry.place,
//       dataset: entry.dataset
//     }, order: '"updatedAt" DESC'}).then(function(R) {
//       var candidate = _.findWhere(R, {isCurrent: true});

//       var prefill = {
//         // country in our test db for default year
//           place: candidate.place
//         , dataset: candidate.dataset
//         , exists: candidate.answers.exists
//       };

//       var url = 'http://www.ordnancesurvey.co.uk/opendata/';


//       config.set('test:user', {userid: userFixtures[0].data.id});

//       request(app)
//         .get('/census/submit/')
//         .set('Host', 'site1.dev.census.org')
//         .query(prefill)
//         .expect(200)
//         .then(function(res) {
//           // all test regex tests are rather hacky ...
//           checkContent(res, 'value="%s" selected="true"'.replace('%s', prefill.place), 'place not set');

//           checkContent(
//             res,
//             marked(_.find(datasetFixtures, function(D) { return D.data.id === candidate.dataset; }).data.description),
//             'Dataset description not parsed as markdown'
//           );

//           testRadio(res.text, 'exists', prefill.exists);
//           // REMOVED AS THESE FIELDS DEPEND ON UI INTERACTIONS
//           // checkContent(res, 'name="url" value="' + url + '"', 'url not set');
//           done();
//         });
//     });
//   });

//   it('GET review', function(done) {
//     var entry = _.find(entryFixtures, function(E) { return E.data.isCurrent === false && E.data.site === 'site2' }).data;
//     var dataset = _.find(datasetFixtures, function(D) { return D.data.id === entry.dataset }).data;

//     request(app)
//       .get('/census/submission/' + entry.id)
//       .set('Host', 'site2.dev.census.org')
//       .expect(200)
//       .then(function(res) {
//         checkContent(res, config.get('review_page'));
//         checkContent(res, dataset.description, 'correct dataset shows up');
//         done();
//       });
//   });

// });
