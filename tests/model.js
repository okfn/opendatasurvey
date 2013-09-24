var assert = require('assert')
  , config = require('../lib/config.js')
  , mocha = require('mocha')
  , _ = require('underscore')
  ;

// use the test database
var options = {
 'key': '0AqR8dXc6Ji4JdHR5WWdUU2dYUElPaFluUlBJbkFOMUE'
};
config.set('database:country:spreadsheetKey', options.key);

// only require after setting config ...
var model = require('../lib/model.js').OpenDataCensus
  , Backend = require('../lib/model.js').Backend
  ;

// some rules
// we only add rows where place = Germany (so we can delete afterwards)
describe('Backend Entry', function() {
  this.timeout(3000);
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
});

describe('Submissions', function() {
  this.timeout(3000);
  var backend = new Backend(options);

  before(function(done) {
    backend.login(function(err){
      if (err) throw err;
      done();
    });
  });
  after(function(done) {
    backend.deleteAll(backend.options.submissionIndex, {place: 'Germany'}, complete);
    backend.deleteAll(backend.options.entryIndex, {place: 'Germany'}, complete);
    var count = 2;
    function complete() {
      count--;
      if (count === 0) done();
    }
  });
  it('get', function(done) {
    backend.getSubmission({submissionid: 'testid-1'}, function(err, entry) {
      assert.ok(!err);
      assert.ok(entry!=null, 'No entry (entry is null)');
      assert.equal(entry.dataset, 'timetables', entry);
      assert.equal(entry.public, 'Yes', entry);
      done();
    });
  });

  it('insert', function(done) {
    var data = {
      year: 2012,
      dataset: 'spending',
      place: 'Germany',
      exists: 'No'
    };
    backend.insertSubmission(data, function(err, obj) {
      assert.ok(!err);
      assert.equal(obj.submissionid.length, 36);
      assert.equal(obj.timestamp.slice(0, 4), '2013');
      // TODO: check something was actually created by doing the get
      done();
    });
  });
  it('accept', function(done) {
    this.timeout(8000);
    var data = {
      year: 2012,
      dataset: 'timetables',
      place: 'Germany',
      exists: 'Yes',
      public: 'No'
    };
    var newdata = {
      public: 'Yes'
    }
    backend.insertSubmission(data, function(err, obj) {
      // now check we can reject it ...
      backend.getSubmission(data, function(err, subm) {
        // check initial conditions
        assert.equal(subm.reviewed, '');
        // do submit 
        backend.acceptSubmission(subm, newdata, function(err) {
          // check entry
          backend.getEntry(data, function(err, obj) {
            assert(!err, 'get entry ok');
            assert(obj, obj);
            assert.equal(obj.exists, data.exists);
            assert.equal(obj.public, newdata.public);
            // check submission
            backend.getSubmission(subm, function(err, newobj) {
              assert(newobj)
              assert.equal(newobj.reviewed, 1);
              done();
            });
          });
        });
      });
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
    assert.equal(c.summary.entries, 2);
    // console.log(c.summary);
    assert(c.summary.open >= 0 && c.summary.open <= c.summary.entries);
    assert(c.summary.open_percent >= 0.0);
  });

  it('country.places is ok ', function(){
    // test places / countries
    assert.equal(c.places.length, 1);
  });

  it('country.datasets is ok ', function(){
    // test datasets
    assert.equal(c.datasets.length, 10);
    assert.equal(c.datasets[0].id, 'timetables');
  });

  it('country.byplace is ok ', function(){
    assert.equal(_.keys(c.byplace).length, c.places.length);

    var uk = c.byplace['United Kingdom'];
    assert.equal(_.keys(uk.datasets).length, 2);
    // assert(uk.datasets[
  });

  it('country item is ok ', function(){
    var uk = c.byplace['United Kingdom'].datasets['maps'];
    // console.log(uk);
    assert.equal(uk.exists, 'Y');
    assert.equal(uk['uptodate'], 'Y');
    assert.equal(uk.ycount, 7);
    assert.equal(uk.isopen, false);
  });

  it('country census item open is ok ', function(){
    var uk = c.byplace['United Kingdom'].datasets['map'];
    // TODO: reinstate
    // assert.equal(uk.ycount, 6);
    // assert.equal(uk.isopen, true);
  });

  // /////////////////////
  // G8

  it('g8 census is ok ', function(){
    var g8 = model.data.g8;
    // console.log(g8.results.length);
    assert.equal(_.keys(g8.datasets).length, 10);
    assert.equal(g8.results.length, 2);
    assert.equal(_.keys(g8.byplace).length, 1);
    assert.equal(g8.summary.open, 0);
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
    assert.equal(berlintt.score, 60);
    assert.equal(berlintt.totalopen, 5);
  });

  // /////////////////////
  // Catalogs

  it('catalogs is ok ', function(){
    // console.log(model.data.catalogs.records.length);
    assert(model.data.catalogs.records.length >= 280);
  });

});
