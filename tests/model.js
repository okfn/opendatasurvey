var assert = require('assert')
  , model = require('../lib/model.js').OpenDataCensus
  , Backend = require('../lib/model.js').Backend
  , mocha = require('mocha')
  , _ = require('underscore')
  ;

var options = {
 'key': '0AqR8dXc6Ji4JdHR5WWdUU2dYUElPaFluUlBJbkFOMUE'
};

// some rules
// we only add rows where place = Germany (so we can delete afterwards)
describe('Backend', function() {
  this.timeout(2000);
  var backend = new Backend(options);

  before(function(done) {
    backend.login(function(err){
      if (err) throw err;
      done();
    });
  });
  after(function(done) {
    // TODO: delete all Germany entries
    backend.getEntrys({place: 'Germany'}, function(err, rows) {
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
  it('getEntrys', function(done) {
    backend.getEntrys({place: 'United Kingdom'}, function(err, entrys) {
      assert.ok(!err);
      assert.ok(entrys!==[]);
      assert.equal(entrys.length, 2);
      done();
    });
  });
  it('getEntry', function(done) {
    backend.getEntry({year: 2012, dataset: 'timetables', place: 'United Kingdom'}, function(err, entry) {
      assert.ok(!err);
      assert.ok(entry!=null, 'No entry (entry is null)');
      assert.equal(entry.public, 'Yes', entry);
      done();
    });
  });
  it('insertEntry and updateEntry', function(done) {
    var data = {
      year: 2012,
      dataset: 'spending',
      place: 'Germany',
      exists: 'No'
    };
    var newData = {
      exists: 'Yes'
    }
    backend.insertEntry(data, function(err) {
      // TODO: check something was actually created
      assert.ok(!err);
      backend.updateEntry(data, newData, function(err) {
        assert.ok(!err);
        done();
      });
    });
  });


  // Submissions

  it('insertSubmission', function(done) {
    var data = {
      year: 2012,
      dataset: 'spending',
      place: 'Germany',
      exists: 'No'
    };
    backend.insertSubmission(data, function(err, obj) {
      // TODO: check something was actually created
      assert.ok(!err);
      assert.equal(obj.submissionid.length, 36);
      assert.equal(obj.timestamp.slice(0, 4), '2013');
      done();
    });
  });
});

describe('census', function() {
  before(function(done) {
    this.timeout(5000);
    model.load(function(err){
      if (err) throw err;
      done();
    });
  });

  var c = model.data.country;

  it('country summary is ok', function(){
    // summary tests
    assert(c.summary.entries >= 350);
    // console.log(c.summary);
    assert(c.summary.open >= 0 && c.summary.open <= c.summary.entries);
    assert(c.summary.open_percent >= 0.0);
  });

  it('country.places is ok ', function(){
    // test places / countries
    assert(c.places.length >= 50);
  });

  it('country.datasets is ok ', function(){
    // test datasets
    assert.equal(c.datasets.length, 10);
    assert.equal(c.datasets[0].id, 'timetables');
  });

  it('country.byplace is ok ', function(){
    assert.equal(_.keys(c.byplace).length, c.places.length);

    var uk = c.byplace['United Kingdom'];
    assert.equal(_.keys(uk.datasets).length, c.datasets.length);
    // assert(uk.datasets[
  });

  it('country item is ok ', function(){
    var uk = c.byplace['United Kingdom'].datasets['elections'];
    // console.log(uk);
    assert.equal(uk.exists, 'Y');
    assert.equal(uk['uptodate'], 'Y');
    assert.equal(uk.ycount, 5);
    assert.equal(uk.isopen, false);
  });

  it('country census item open is ok ', function(){
    var uk = c.byplace['United Kingdom'].datasets['map'];
    assert.equal(uk.ycount, 6);
    assert.equal(uk.isopen, true);
  });

  // /////////////////////
  // G8

  it('g8 census is ok ', function(){
    var g8 = model.data.g8;
    // console.log(g8.results.length);
    assert.equal(_.keys(g8.datasets).length, 10);
    assert.equal(g8.results.length, 96);
    assert.equal(_.keys(g8.byplace).length, 8);
    assert.equal(g8.summary.open, 35);
  });

  // /////////////////////
  // City

  var city = model.data.city;

  it('city summary is ok', function(){
    // console.log(city.summary);
    assert(city.summary.entries >= 300);
    assert(city.summary.open >= 0 && city.summary.open <= city.summary.entries);
    assert(city.summary.open_percent >= 0.0);
  });

  it('city.places is ok ', function(){
    // test places / countries
    // console.log(city.places.length);
    assert(city.places.length >= 34);
    assert(_.contains(city.places, 'Berlin'));
  });

  it('city.datasets is ok ', function(){
    // test datasets
    assert.equal(city.datasets.length, 15);
    assert.equal(city.datasets[0].id, 'timetables');
  });

  it('city.byplace is ok ', function(){
    assert.equal(_.keys(city.byplace).length, city.places.length);

    var berlin = city.byplace['Berlin'];
    // bad test as number will change over time!!
    assert.equal(_.keys(berlin.datasets).length, 14);
  });

  it('city data is ok', function(){
    var berlintt = city.byplace['Berlin'].datasets['timetables'];
    assert.equal(berlintt.ycount, 6);
    assert.equal(berlintt.isopen, true);
  });

  it('city score is ok', function(){
    var berlintt = city.byplace['Berlin'];
    assert.equal(berlintt.score, 53);
    assert.equal(berlintt.totalopen, 5);
  });

  // /////////////////////
  // Catalogs

  it('catalogs is ok ', function(){
    // console.log(model.data.catalogs.records.length);
    assert(model.data.catalogs.records.length >= 280);
  });

});
