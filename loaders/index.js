'use strict';
var config = require('../lib/config');
var entitiesConstructor = require('./includes/entitiesConstructor');
var spreadSheetHandler = require('./includes/spreadSheetHandler');
var dbTransactions = require('./includes/dbTransactions');
var Promise = require('bluebird');

var REGISTRY_FULL_DATA = false;
var MAIN_CONFIG_FULL_DATA = false;

var indexLoader = {
  loadPlace: function (site_id) {
    console.log('loadPlace');
    console.log(site_id);
  }
};
module.exports = indexLoader;

