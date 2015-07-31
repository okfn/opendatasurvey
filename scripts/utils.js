var _ = require('lodash');
var csv = require('csv');
var fs = require('fs');
var models = require('../census/models');
var Promise = require('bluebird');
var uuid = require('node-uuid');
var fileData = fs.readFileSync(process.argv[2], {encoding: 'utf-8'});


var loadData = function(promises) {
  return Promise.all(_.map(promises, function(V, K) {

    return new Promise(function(RS, RJ) {
      V.then(function(D) { RS([K, D]); });
    });

  }))
    .then(function(V) {return _.object(V);})
    .catch(console.log.bind(console));
};


module.exports = {
  anonymousUserId: '0e7c393e-71dd-4368-93a9-fcfff59f9fff',
  questions: [
    'exists',
    'digital',
    'public',
    'machinereadable',
    'bulk',
    'openlicense',
    'uptodate',
    'online',
    'free',
    'url',
    'format',
    'licenseurl',
    'dateavailable',
    'officialtitle',
    'publisher',
    'qualityinfo',
    'qualitystructure',
    'details'
  ],
  loadData: loadData,
  qCorrecter: {
    'yes': true,
    'no': false,
    'unsure': null
  },
  idMapper: {
    'national': 'global',
    'aus-region': 'australia',
    'car-region': 'caribbean'
  }
};
