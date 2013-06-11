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
    console.log(_.keys(c.bydataset));
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
