'use strict';

var _ = require('underscore');
var config = require('../config');
var models = require('../models');
var entitiesConstructor = require('./includes/entitiesConstructor');
var spreadSheetHandler = require('./includes/spreadSheetHandler');
var dbTransactions = require('./includes/dbTransactions');

var indexLoader = {
  loadRegistry: function () {
    // WARN Implement actual permissions check here
    var hasPermissions = false;

    var registryUrl = config.get('registryUrl') || false;

    return spreadSheetHandler.parse(registryUrl)
      .spread(function (err, registry) {
        if (err)
          return [err, false];

        if (!registry)
          return ['could not reload registry', false];

        return models.Registry.count().then(function(C) {
          if (!hasPermissions && Boolean(C))
            return ['You don\'t have enough permissions'];

          // Make each upsert (can't do a bulk with upsert, but that is ok for our needs here)
          return Promise.all(_.map(registry, function(R) { return new Promise(function(RS, RJ) {

            // Normalize data before upsert
            models.Registry.upsert(_.extend(R, {
              id: R.censusid,
              settings: _.omit(R, 'censusid')
            })).then(function() { RS(false); });

          }); }));
        });
      });
  },

  /*
   * load Datasets from sheet to DB
   */
  loadData: function (options) {
    return new Promise(function(RS, RJ) {
      models.Site.findById(options.site).then(function(S) {
        spreadSheetHandler.parse(S.settings[options.setting]).spread(function (E, D) {
          if (E)
            RJ(E);

          Promise.all(_.map(D, function(DS) { return new Promise(function(RSD, RJD) {

            // Allow custom data maping
            options.Model.upsert(_.extend(_.isFunction(options.mapper) ? options.mapper(DS) : DS, {
              site: options.site
            })).then(RSD).catch(RJD);

          }); })).then(RS).catch(RJ);
        });
      });
    });
  },

  /*
   * load Config (Site) from sheet to DB
   */
  loadConfig: function (siteId) {
    return new Promise(function(RS, RJ) {
      models.Registry.findById(siteId).then(function(R) {
        spreadSheetHandler.parse(R.settings.configurl).spread(function (E, C) {
          if (E)
            RJ(E);

          // Insert single record — config for required site
          models.Site.upsert({
            id: siteId,
            settings: _.object(_.zip(_.pluck(C, 'key'), _.pluck(C, 'value')))
          })
            .then(function() { RS(false); })
            .catch(function(E) { RJ(E); });
        });
      });
    });
  }
};
//get suitable registry from registry array
function pullRequiredRegistryFromArray(registryArray, siteId) {
  var result = false;
  for (var i = 0; i < registryArray.length; i++) {
    var currentRegistry = registryArray[0];
    if (currentRegistry['censusid'] === siteId) {
      result = currentRegistry;
      break;
    }
  }
  return result;
}


module.exports = indexLoader;
