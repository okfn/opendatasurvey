var request = require('supertest')
  , assert = require('assert')
  , config = require('../lib/config.js')
  // importing base sets the test db
  , base = require('./base.js')
  ;

config.set('test:testing', true);
config.set('appconfig:port', 5001 + Math.floor(Math.random() * 1000));

// only require after setting config ...
var model = require('../lib/model.js').OpenDataCensus;

var app = require('../app.js').app;

describe('Country', function() {
  this.timeout(8000);
  before(function(done) {
    model.load(function() {
      model.backend.login(function(err){
        done(err);
      });
    });
  });
  after(function(done) {
    // TODO: delete all Germany entries
    model.backend.getSubmissions({place: 'Germany'}, function(err, rows) {
      if (rows.length == 0) {
        done();
      }
      rows.forEach(function(entry) {
        entry.del(function(err) {
          if(err) {
            console.log(err);
          }
          done();
        });
      });
    });
  });

  it('front page works', function(done) {
    request(app)
      .get('/country/')
      .expect(200, done)
      ;
  });

  it('GET Submission', function(done) {
    request(app)
      .get('/country/submit/')
      .expect(200)
      .end(function(err, res) {
        assert(res.text.match('Country - Submit'));
        done();
      });
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
        place: 'Uganda'
      , dataset: 'emissions'
      , exists: 'Yes'
      , digital: 'Unsure'
      , online: 'No'
      , url: 'http://xyz.com'
      , details: 'Lots of random stuff\n\nincluding line breaks'
    };
    request(app)
      .get('/country/submit/')
      .query(prefill)
      .expect(200)
      .end(function(err, res) {
        assert(!err);
        // all test regex tests are rather hacky ...
        assert(res.text.match('value="%s" selected="true"'.replace('%s', prefill.place)), 'place not set');
        assert(res.text.match('value="emissions" selected="true"'), 'dataset not set');
        assert(res.text.match('value="emissions" selected="true"'), 'dataset not set');
        testRadio(res.text, 'exists', prefill.exists);
        testRadio(res.text, 'digital', prefill.digital);
        testRadio(res.text, 'online', prefill.online);
        assert(res.text.match('name="url" value="' + prefill.url + '"'), 'url not set');
        assert(res.text.match(prefill.details + '</textarea>'), 'details not set');
        done();
      });
  });

  it('GET Submission pre-populated with entry', function(done) {
    var prefill = {
      // country in our test db for default year
        place: 'United Kingdom'
      , dataset: 'maps'
    };
    var url = 'http://www.ordnancesurvey.co.uk/opendata/';
    request(app)
      .get('/country/submit/')
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
    request(app)
      .post('/country/submit/')
      .type('form')
      .field('year', '2014')
      .field('dataset', 'timetables')
      .field('place', 'Germany')
      .field('exists', 'No')
      .expect(302)
      .end(function(err, res) {
        assert.equal(res.header['location'], '/country/overview/Germany');
        done();
      });
  });

  it('GET review', function(done) {
    var url = '/country/review/2948d308-ce1c-46fb-b131-dc0f846da788';
    request(app)
      .get(url)
      .expect(200)
      .end(function(err, res) {
        assert(res.text.match('Publish will overwrite the whole current entry'), 'on review page');
        assert(res.text.match('National government budget at a high level'), 'correct dataset shows up');
        done();
      });
  });
});

