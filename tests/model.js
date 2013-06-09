var assert = require('assert')
  , model = require('../models/country.js').OpenDataCensus
  , mocha = require('mocha')
  , _ = require('underscore')
  ;

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
  });

  it('country.bydataset is ok ', function(){
    // console.log(_.keys(c.bydataset));
    assert.equal(_.keys(c.bydataset).length, c.datasets.length);

    assert.equal(c.bydataset['Election Results (national)']['Jamaica'], null);

    var ds = c.bydataset['Election Results (national)'];
    assert.equal(_.keys(ds).length, c.places.length);
    var uk = ds['United Kingdom'];
    // console.log(uk);
    assert.equal(uk.exists, 'Y');
    assert.equal(uk['uptodate'], 'Y');
    assert.equal(uk.ycount, 5);
    assert.equal(uk.isopen, false);
  });

  it('country census item open is ok ', function(){
    var ds = c.bydataset['National Map (Low resolution: 1:250,000 or better)'];
    var uk = ds['United Kingdom'];
    assert.equal(uk.ycount, 6);
    assert.equal(uk.isopen, true);
  });
});
