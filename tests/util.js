var request    = require('request')
  , sinon      = require('sinon')
  , assert     = require('assert')

  , config     = require('../lib/config.js')
  , util       = require('../lib/util.js')
  ;

describe('Config', function(){
  it('config is basic if not loaded', function(done){
    assert.equal(config.get('configUrl'), 'http://config.url');
    assert.equal(config.get('title'), undefined);
    done();
  });
});

var csvdata = [
  'Key,Value',
  'title,Test Open Data Census',
  ].join('\n')

describe('Config', function(){
  before(function(done){
    sinon
      .stub(request, 'get')
      .yields(null, null, csvdata);
    util.loadConfig(done);
  });

  after(function(done){
    request.get.restore();
    done();
  });

  it('config is basic if not loaded', function(done){
    assert.equal(config.get('configUrl'), 'http://config.url');
    assert.equal(config.get('title'), 'Test Open Data Census');
    done();
  });
});
