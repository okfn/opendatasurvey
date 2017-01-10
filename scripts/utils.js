'use strict';

const _ = require('lodash');
const Promise = require('bluebird');

var loadData = function(promises) {
  return Promise.all(_.map(promises, function(V, K) {
    return new Promise(function(RS, RJ) {
      V.then(function(D) {
        RS([K, D]);
      });
    });
  })).then(function(V) {
    return _.object(V);
  }).catch(console.trace.bind(console));
};

module.exports = {
  anonymousUserId: '0e7c393e-71dd-4368-93a9-fcfff59f9fff',
  loadData: loadData
};
