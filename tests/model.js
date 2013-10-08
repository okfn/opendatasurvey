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
    backend.getEntry({year: 2013, dataset: 'maps', place: 'United Kingdom'}, function(err, entry) {
      assert.ok(!err);
      assert.ok(entry!=null, 'No entry (entry is null)');
      assert.equal(entry.public, 'Yes', entry);
      done();
    });
  });
  it('insertEntry and updateEntry', function(done) {
    //Deliberately include new line in details field
    var data = {
      year: 2012,
      dataset: 'spending',
      place: 'Germany',
      details: 'Some \ndetails',
    };
    var newData = {
      details: 'New details'
    }
    backend.insertEntry(data, function(err) {
      //TODO: Test that something was inserted
      assert.ok(!err);
      //N.B. We need to delete this anyway for getEntry, but having newlines in the query string, even when encoded, causes HTTP 400 error
      delete data['details'];
      backend.updateEntry(data, newData, function(err) {
        assert.ok(!err);
        //Test that field was 'changed' (we didn't check the original value yet, TODO)
        backend.getEntry(data, function(err, entry) {
          assert.equal(entry.details, 'New details', entry);
          done();
        });
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
  it('get byplace', function(done) {
    backend.getPlace('United Kingdom', function(err, data) {
      // submissions has 2 items for UK but only one is unreviewed
      assert.equal(data.submissions.length, 1);
      assert.equal(data.entrys.length, 2);
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
    this.timeout(10000);
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

              // now resubmit the submission (atm we are allowed to do this)
              backend.acceptSubmission(subm, {online: 'No'}, function(err) {
                backend.getEntrys({dataset: data.dataset, place: data.place, year: data.year}, function(err, rows) {
                  assert.equal(rows.length, 1);
                  assert.equal(rows[0].online, 'No');
                  done();
                });
              });
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
    assert.equal(uk.ycount, 60);
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
  // Catalogs

  it('catalogs is ok ', function(){
    // console.log(model.data.catalogs.records.length);
    assert(model.data.catalogs.records.length >= 280);
  });

});
