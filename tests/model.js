var assert = require('assert')
  , model = require('../models/country.js').OpenDataCensus
  , mocha = require('mocha')
  , _ = require('underscore')
  ;

describe('census', function() {
  it('everything', function(done){
    this.timeout(5000);
    model.load(function(err){
      if (err) throw err;
      var c = model.data.country;

      // summary tests
      assert(c.summary.entries >= 350);
      // console.log(c.summary);
      assert(c.summary.open >= 0 && c.summary.open <= c.summary.entries);
      assert(c.summary.open_percent >= 0.0);

      // test places / countries
      assert(c.places.length >= 50);

      // test datasets
      assert.equal(c.datasets.length, 10);

      // test results
      // console.log(_.keys(c.bydataset));
      assert.equal(_.keys(c.bydataset).length, c.datasets.length);

      var ds = c.bydataset['Election Results (national)'];
      assert.equal(_.keys(ds).length, c.places.length);
      var uk = ds['United Kingdom'];
      // console.log(uk);
      assert.equal(uk.exists, 'Y');
      assert.equal(uk['uptodate'], 'Y');
      assert.equal(uk.ycount, 5);
      assert.equal(uk.isopen, false);

      // test is open again
      var ds = c.bydataset['National Map (Low resolution: 1:250,000 or better)'];
      var uk = ds['United Kingdom'];
      assert.equal(uk.ycount, 6);
      assert.equal(uk.isopen, true);

      assert.equal(c.bydataset['Election Results (national)']['Jamaica'], null);

      done();
    });
  })
});
