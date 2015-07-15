var request = require('supertest')
  , app = require('../census/app.js').app
  , assert = require('assert')
  , config = require('../census/config')
  , mocha = require('mocha')
  , models = require('../census/models')
  , _ = require('underscore')
  ;

config.set('test:testing', true);
config.set('approve_first_submission', 'TRUE');

// some rules
// we only add rows where place = Germany (so we can delete afterwards)
describe('Backend Entry', function() {
  it('getEntrys', function(done) {
    models.Entry.findAll({where: {place: 'gb'}}).then(function(R) {
      assert(R.length > 1);
      done();
    });
  });
  it('getEntry', function(done) {
    backend.getEntry({year: 2013, dataset: 'maps', place: 'gb'}, function(err, entry) {
      assert.ok(!err, err);
      assert.ok(entry!=null, 'No entry (entry is null)');
      assert.equal(entry.public, 'Yes');
      done();
    });
  });
  it('insertEntry and updateEntry', function(done) {
    //Deliberately include new line in details field
    var data = {
      year: 2012,
      dataset: 'spending',
      place: 'de',
      details: 'Some \ndetails',
    };
    var newData = {
      details: 'New details'
    }
    backend.insertEntry(data, function(err) {
      //TODO: Test that something was inserted
      assert.ok(!err, err);
      //N.B. We need to delete this anyway for getEntry, but having newlines in the query string, even when encoded, causes HTTP 400 error
      delete data['details'];
      backend.getEntry(data, function(err, entry) {
        assert.ok(!err, err);
        backend.updateEntry(entry, newData, function(err) {
          assert.ok(!err);
          //Test that field was 'changed' (we didn't check the original value yet, TODO)
          backend.getEntry(entry, function(err, updatedEntry) {
            assert.equal(updatedEntry.details, 'New details');
            done();
          });
        });
      });
    });
  });
  it('two entries, choose the earlier year', function(done) {
    var earlier = {
      year: 2012,
      dataset: 'spending',
      place: 'de',
      details: 'Some details',
    };
    var later = {
      year: 2013,
      dataset: 'spending',
      place: 'de',
      details: 'New details',
    };

    backend.insertEntry(later, function(err) {
      //TODO: Test that something was inserted
      assert.ok(!err, err);
      backend.insertEntry(earlier, function(err) {
        //TODO: Test that something was inserted
        assert.ok(!err, err);
        backend.getEntry(earlier, function(err, entry) {
          assert.equal(entry.details, 'Some details');
          assert.equal(entry.year, '2012');
          done();
        });
      });
    });
  });
});

describe('getAllEntrysWithInfo', function() {
  var db = {};

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

  it('entries.byplace is ok ', function(){
    assert.equal(Object.keys(db.entries.byplace).length, db.places.length);

    var uk = db.entries.byplace['gb'];
    assert.equal(Object.keys(uk.datasets).length, 2);
    assert.equal(uk.score, 75);
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
});

describe('Submissions', function() {
  it('get', function(done) {
    model.backend.getSubmission({submissionid: 'testid-1'}, function(err, entry) {
      assert.ok(!err);
      assert.ok(entry!=null, 'No entry (entry is null)');
      assert.equal(entry.dataset, 'timetables');
      assert.equal(entry.public, 'Yes');
      done();
    });
  });
  it('get byplace', function(done) {
    model.backend.getPlace('gb', function(err, data) {
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
      place: 'de',
      exists: 'No'
    };
    var user = {
      userid: 'xyz',
      name: 'Test Submitter'
    };
    model.backend.insertSubmission(data, user, function(err, obj) {
      assert.ok(!err, err);
      assert.equal(obj.submissionid.length, 36);
      assert.equal(obj.timestamp.slice(0, 4), '2014');
      model.backend.getSubmission({submissionid: data.submissionid}, function(err, out) {
        assert.ok(!err, err);
        assert.equal(out.year, data.year);
        assert.equal(out.reviewed, '');
        assert.equal(out.submitter, user.name);
        assert.equal(out.submitterid, user.userid);
        assert.equal(out.censusid, dboptions.censusid);
        done();
      });
    });
  });
  it('processSubmission', function(done) {
    this.timeout(base.LONG_TIMEOUT);
    var data = {
      exactyear: true,
      year: 2012,
      dataset: 'timetables',
      place: 'de',
      exists: 'Yes',
      public: 'No'
    };
    var newdata = {
      public: 'Yes'
    }
    // do submit
    var user = {
      userid: 'xxx',
      name: 'test reviewer'
    };
    model.backend.insertSubmission(data, null, function(err, subm) {
      var acceptSubmission = true;
      model.backend.processSubmission(user, acceptSubmission, subm.submissionid, newdata, function(err) {
        // check we have created an entry
        model.backend.getEntry(data, function(err, obj) {
          assert(!err, 'get entry ok');
          assert(obj, obj);
          assert.equal(obj.exists, data.exists);
          assert.equal(obj.public, newdata.public);
          // check submission
          model.backend.getSubmission(subm, function(err, newobj) {
            assert(newobj)
            assert.equal(newobj.reviewed, 1);
            assert.equal(newobj.reviewer, user.name);
            assert.equal(newobj.reviewerid, user.userid);
            assert.equal(newobj.reviewresult, 'accepted');

            // now redo review to check case of review where entry already exists
            var newnewdata = {online: 'No'};
            model.backend.processSubmission(user, acceptSubmission, subm.submissionid, newnewdata, function(err) {
              model.backend.getEntrys({dataset: data.dataset, place: data.place, year: data.year}, function(err, rows) {
                assert.equal(rows.length, 1);
                assert.equal(rows[0].online, 'No');

                request(app)
                  .get('/')
                  .expect(200)
                  .end(function(err, res) {
                    // check the new entry is shown on homepage
                    assert.equal(res.text.match(/\/submit\/\?dataset=timetables&place=de/), null, 'New entry not shown on homepage');
                    done();
                  })
                ;
              });
            });
          });
        });
      });
    });
  });
});

describe('User', function() {
  var profile = {
    provider: 'facebook',
    id: 'tests-xyz',
    emails: [{ value: 'a@a.com'}],
    name: { familyName: 'george' }
  };

  it('create a user', function(done) {
    backend.createUserIfNotExists(userinfo, function(err) {
      if (err) {
        return done(err);
      }
      backend.getUser(userinfo, function(err, userobj) {
        assert.equal(userobj.email, userinfo.email);
        assert.equal(userobj.familyname, 'george');
        assert(userobj.id);
        done(err);
      });
    });
  });
});
