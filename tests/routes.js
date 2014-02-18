var assert = require('assert')
  , census = require('../routes/census')
  , config = require('../lib/config.js')
  ;

config.set('test:testing', true);

describe('census', function() {
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
  it('census#canReview returns true for email foo@bar.com', function(done) {
    config.set('reviewers', ['tester']);
    assert(census.canReview({
      userid: 'tester',
      email: 'foo@bar.com'
    }), 'tester should be able to review');
    done();
  });
});
