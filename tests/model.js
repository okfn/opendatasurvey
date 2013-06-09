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
    assert.equal(c.datasets[0].id, 'timetables');
  });

  it('country.byplace is ok ', function(){
    assert.equal(_.keys(c.byplace).length, c.places.length);

    var uk = c.byplace['United Kingdom'];
    assert.equal(_.keys(uk.datasets).length, c.datasets.length);
    // assert(uk.datasets[
  });

  it('country.bydataset is ok ', function(){
    // console.log(_.keys(c.bydataset));
    assert.equal(_.keys(c.bydataset).length, c.datasets.length);

    assert.equal(c.bydataset['elections']['Jamaica'], null);

    var ds = c.bydataset['elections'];
    assert.equal(_.keys(ds).length, c.places.length);
    var uk = ds['United Kingdom'];
    // console.log(uk);
    assert.equal(uk.exists, 'Y');
    assert.equal(uk['uptodate'], 'Y');
    assert.equal(uk.ycount, 5);
    assert.equal(uk.isopen, false);
  });

  it('country census item open is ok ', function(){
    var ds = c.bydataset['map'];
    var uk = ds['United Kingdom'];
    assert.equal(uk.ycount, 6);
    assert.equal(uk.isopen, true);
  });

  var city = model.data.city;
});
