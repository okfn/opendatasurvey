var fs = require('fs')
  , path = require('path')
  , request = require('request')
  , assert = require('assert')
  , Q = require('q')

  , base = require('./base.js')
  , config = require('../lib/config.js')
  , util = require('../lib/util.js')
  ;

describe('Config - load', function(){
  before(function(done){
    base.setFixtures();
    util.loadConfig(done);
  });

  after(function(done){
    base.unsetFixtures();
    done();
  });

  it('config is loaded', function(done){
    assert.equal(config.get('title'), 'Test Open Data Census');
    assert.equal(config.get('questions'), 'https://docs.google.com/spreadsheet/pub?key=0Aon3JiuouxLUdEVHQ0c4RGlRWm9Gak54NGV0UlpfOGc&single=true&gid=1&output=csv');
    assert.equal(config.get('entries'), 'https://docs.google.com/spreadsheet/pub?key=0AqR8dXc6Ji4JdHR5WWdUU2dYUElPaFluUlBJbkFOMUE&single=true&gid=1&output=csv');
    assert.equal(config.get('display_year'), 2013);
    assert.equal(config.get('about_page'), 'This is the about page');
    assert.deepEqual(config.get('reviewers'), ['tester', 'a-reviewer']);
    done();
  });
});

// test loading a simpler config and also using a non csv url for config
describe('Config - load simple', function(){
  var configUrl = config.get('configUrl');
  before(function(done){
    config.reset();
    config.set('configUrl', base.simpleConfigUrl);
    base.setFixtures();
    util.loadConfig(done);
  });

  after(function(done){
    config.set('configUrl', configUrl);
    base.unsetFixtures();
    done();
  });

  it('config is loaded', function(done){
    assert.equal(config.get('title'), 'Simple Open Data Census');

    assert.equal(config.get('database_spreadsheet_key'), 'AAAA');

    // should be default value from config
    var questions = 'https://docs.google.com/spreadsheet/pub?key=0AqR8dXc6Ji4JdFI0QkpGUEZyS0wxYWtLdG1nTk9zU3c&single=true&gid=0&output=csv';
    assert.equal(config.get('questions'), questions);

    var datasets = 'https://docs.google.com/spreadsheet/pub?key=0Aon3JiuouxLUdEVHQ0c4RGlRWm9Gak54NGV0UlpfOGc&single=true&gid=3&output=csv';
    assert.equal(config.get('datasets'), datasets);

    // base.simpleConfigCsvUrl with index + 1
    var places = 'https://docs.google.com/spreadsheet/pub?key=0AqR8dXc6Ji4JdEg2elXXXX&single=true&gid=3&output=csv';
    assert.equal(config.get('places'), places);
    var user_database_key = '0AqR8dXc6Ji4JdGJXallkcjNOaFlmN1N5MXZkM1ZSbUE';
    assert.equal(config.get('user_database_key'), user_database_key);
    assert.equal(config.get('display_year'), 2013);
    done();
  });
});

describe('LoadFixedData', function(){
  var db = {};
  before(function(done){
    base.setFixtures();
    Q.nfcall(util.loadConfig)
      .then(function() {
        return Q.nfcall(util.loadFixedData, db)
       })
      .fail(function(e) {
        done(e)
      })
      .then(function() {
        done();
      })
      ;
  });

  after(function(done){
    base.unsetFixtures();
    done();
  });

  it('questions ok', function(done) {
    assert.equal(db.questions.length, 18);
    assert.equal(db.questions[0].id, 'exists');
    assert.equal(db.questions[0].icon, 'file-alt');
    assert.equal(db.scoredQuestions.length, 9);
    assert.equal(db.scoredQuestions[0].id, 'exists');
    assert.equal(db.scoredQuestions[8].id, 'uptodate');
    assert.equal(db.questionsById.details.question, 'Further Details and Comments (optional but strongly encouraged)');
    done();
  });

  it('datasets ok ', function() {
    assert.equal(db.datasets.length, 10);
    assert.equal(db.datasets[0].id, 'timetables');
  });

  it('places ok ', function() {
    assert.equal(db.places.length, 249);
    assert.equal(db.places[0].id, 'af');
    assert.equal(db.places[0].name, 'Afghanistan');
    assert.equal(db.placesById['af'].name, 'Afghanistan');
  });
});

describe('Misc', function(){
  it('makeUserObject', function(done) {
    var profile = {
      id: 'aaa',
      provider: 'facebook',
      displayName: 'x',
      emails: [{ value: 'a@a.com'}]
    };
    out = util.makeUserObject(profile);
    assert.equal(out.userid, 'facebook:aaa');
    done();
  });

  it('parseSpreadsheetUrl', function() {
    out = util.parseSpreadsheetUrl(base.simpleConfigUrl);
    exp = {
      key: '0AqR8dXc6Ji4JdEg2elXXXX',
      sheet: 2
    };
    assert.deepEqual(out, exp);
  });
  it('getCsvUrlForGoogleSheet', function() {
    // no op case
    out = util.getCsvUrlForGoogleSheet(base.simpleConfigUrlCsv);
    assert.deepEqual(out, base.simpleConfigUrlCsv);

    out = util.getCsvUrlForGoogleSheet('http://config.url');
    assert.deepEqual(out, 'http://config.url');

    out = util.getCsvUrlForGoogleSheet(base.simpleConfigUrl);
    assert.deepEqual(out, base.simpleConfigUrlCsv);
  });
});
