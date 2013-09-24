var request = require('supertest')
  , assert = require('assert')
  , config = require('../lib/config.js')
  ;

var options = {
 'key': '0AqR8dXc6Ji4JdHR5WWdUU2dYUElPaFluUlBJbkFOMUE'
};
config.set('database:country:spreadsheetKey', options.key);

// only require after setting config ...
var model = require('../lib/model.js').OpenDataCensus
  ;

var app = require('../app.js').app;

describe('Country', function() {
  before(function(done) {
    model.backend.login(function(err){
      if (err) throw err;
      done();
    });
  });

  it('front page works', function(done) {
    request(app)
      .get('/country/')
      .expect(200, done)
      ;
  });

  it('POST Submission', function(done) {
    request(app)
      .post('/country/submit/')
      .type('form')
      .field('year', '2014')
      .field('dataset', 'timetables')
      .field('place', 'Germany')
      .field('exists', 'No')
      .expect(200)
      .end(function(err, res) {
        assert.ok(!err, err);
        assert.ok(res.text.match(/Thank-you for your submission/));
        // TODO: test something was inserted
        // backend.getSubmission()
        done();
      });
  });
});

