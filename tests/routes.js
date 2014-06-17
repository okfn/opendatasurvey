var assert = require('assert')
  , census = require('../routes/census')
  , config = require('../lib/config.js')
  // importing base sets the test db
  , base = require('./base.js')
  ;

config.set('test:testing', true);

// only require after setting config ...
var model = require('../lib/model.js').OpenDataCensus;

describe('census', function() {
  before(function(done) {
    base.setFixtures();
    model.load(function() {
      app = require('../app.js').app;
      done();
    });
  });
  after(function(done) {
    base.unsetFixtures();
    done();
  });
  it('census#canReview returns false for testerb', function(done) {
    config.set('reviewers', ['tester']);
    assert(!census.canReview({
      userid: 'testerb'
    }), 'tester should not be able to review');
    done();
  });
  it('census#canReview returns true for tester', function(done) {
    config.set('reviewers', ['tester']);
    assert(census.canReview({
      userid: 'tester'
    }), 'tester should be able to review');
    done();
  });
  it('census#canReview returns true for Belgium Tester in Belgium', function(done) {
    config.set('reviewers', ['tester']);
    assert(census.canReview({
      userid: 'belgium_tester@example.com'
    }, 'be'), 'tester should be able to review');
    done();
  });
  it('census#canReview returns false for Belgium Tester in Morocco', function(done) {
    config.set('reviewers', ['tester']);
    assert(!census.canReview({
      userid: 'belgium_tester@example.com'
    }, 'ma'), 'tester should not be able to review');
    done();
  });
  it('census#canReview returns true for email foo@bar.com', function(done) {
    config.set('reviewers', ['tester']);
    assert(census.canReview({
      userid: 'tester',
      email: 'foo@bar.com'
    }), 'tester should be able to review');
    done();
  });
});
