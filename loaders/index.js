'use strict';
var config = require('../lib/config');
var entitiesConstructor = require('./includes/entitiesConstructor');
var spreadSheetHandler = require('./includes/spreadSheetHandler');
var dbTransactions = require('./includes/dbTransactions');
var Promise = require('bluebird');

var REGISTRY_FULL_DATA = false;
var MAIN_CONFIG_FULL_DATA = false;

var indexLoader = {
  loadPlaces: function (siteId) {
    var configUrl = getConfigUrlFromRegistry(signleRegistryObject);
    var placesUrlKey = spreadSheetHandler.getPlacesUrlKey(configUrl);
    var placesSpreadSheetUrl = spreadSheetHandler.getPlacesSpreadSheetUrl(placesUrlKey);

    return spreadSheetHandler.parse(placesSpreadSheetUrl)
      .spread(function (err, parsedPlaces) {
        if (err) {
          return [err, false];
        } else {
          //var site = getSiteValue(signleRegistryObject);
          var site = siteId;
          var mappedPlaces = false;
          parsedPlaces = entitiesConstructor.setSiteValue(parsedPlaces, site);
          mappedPlaces = entitiesConstructor.mapPlaces(parsedPlaces);
          console.log(mappedPlaces);
          process.exit();
          return dbTransactions.savePlaces(mappedPlaces);
        }
      });
  },
  loadDatasets: function (siteId) {

  },
  loadQuestions: function (siteId) {

  },
  loadConfig: function (siteId) {

  }
};
module.exports = indexLoader;

