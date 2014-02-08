var fs = require('fs')
  , path = require('path')
  , request = require('request')
  , sinon = require('sinon')
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
    request.get.restore();
    done();
  });

  it('questions ok', function(done) {
    assert.equal(db.questions.length, 12);
    assert.equal(db.questions[0].id, 'exists');
    assert.equal(db.questions[0].icon, 'file-alt');
    assert.equal(db.scoredQuestions.length, 9);
    assert.equal(db.scoredQuestions[0].id, 'exists');
    assert.equal(db.scoredQuestions[8].id, 'uptodate');
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

describe('LoadSubmittedData', function(){
  var db = {};
  before(function(done){
    base.setFixtures();
    util.loadAll(db, function(err) {
      done(err);
    });
  });

  after(function(done){
    request.get.restore();
    done();
  });

  it('results ok ', function() {
    assert.equal(db.entries.results.length, 2);
    assert.equal(db.entries.results[0].place, 'gb');
  });

  it('entries summary is ok', function(){
    // summary tests
    assert.equal(db.entries.summary.entries, 2);
    // console.log(db.entries.summary);
    assert(db.entries.summary.open >= 0 && db.entries.summary.open <= db.entries.summary.entries);
    assert(db.entries.summary.open_percent >= 0.0);
  });

  it('entries.places is ok ', function(){
    // test places / countries
    assert.equal(db.entries.places.length, 1);
  });

  it('entries.places is sorted by score, descending ', function(){
    // test places / countries
    var scores = db.entries.places.map(function (n) { return db.entries.byplace[n].score; });
    var scoresCopy = scores.slice(0);
    // sort scoresCopy descending, in-place
    scoresCopy.sort().reverse();
    assert.deepEqual(scoresCopy, scores);
  });

  it('entries.byplace is ok ', function(){
    assert.equal(Object.keys(db.entries.byplace).length, db.entries.places.length);

    var uk = db.entries.byplace['gb'];
    assert.equal(Object.keys(uk.datasets).length, 2);
    // assert(uk.datasets[
  });

  it('entries item is ok ', function(){
    var uk = db.entries.byplace['gb'].datasets['maps'];
    // console.log(uk);
    assert.equal(uk.exists, 'Y');
    assert.equal(uk['uptodate'], 'Y');
    assert.equal(uk.ycount, 70);
    assert.equal(uk.isopen, false);
  });

  it('entries census item open is ok ', function(){
    var uk = db.entries.byplace['gb'].datasets['map'];
    // TODO: reinstate
    // assert.equal(uk.ycount, 6);
    // assert.equal(uk.isopen, true);
  });

  it('submissions ok', function() {
    assert.equal(db.submissions.results.length, 4);
    assert.deepEqual(db.submissions.places, ['gb', 'ug']);
    assert.equal(db.submissions.reviewers.length, 0);
  });
});

