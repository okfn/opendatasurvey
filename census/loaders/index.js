'use strict';

var _ = require('underscore');
var config = require('../config');
var models = require('../models');
var entitiesConstructor = require('./includes/entitiesConstructor');
var spreadSheetHandler = require('./includes/spreadSheetHandler');
var dbTransactions = require('./includes/dbTransactions');


module.exports = {
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
            options.Model.upsert(
              _.chain(_.isFunction(options.mapper) ? options.mapper(DS) : DS)

                // All records belongs to certain domain
                .extend({site: options.site})

                .pairs()

                // User may mix up lower cased and upper cased field names
                .map(function(P) { return [P[0].toLowerCase(), P[1]]; })

                .object()
                .value()
            ).then(RSD).catch(RJD);

          }); })).then(RS).catch(RJ);
        });
      });
    });
  },

  // There may be translated fields. Map field name <name>@<language>
  // into translation: {<language>: {<name>: ..., <another name>: ..., ...}}.
  loadTranslatedData: function(options) {
    // Avoid recursive call
    var mapper = options.mapper;

    return module.exports.loadData(_.extend(options, {
      mapper: function(D) {
        // Don't forget to call user defined mapper function
        var mapped = _.isFunction(mapper) ? mapper(D) : D;

        return _.extend(mapped, {
          translations: _.chain(mapped)
            .pairs()

            .reduce(function(R, P) {
              var fieldLang;

              if(!(P[0].indexOf('@') + 1))
                return R;

              fieldLang = P[0].split('@');

              // Default empty dict
              R[fieldLang[1]] = R[fieldLang[1]] || {};

              R[fieldLang[1]][fieldLang[0]] = P[1];

              return R;
            }, {})

            .value()
        });
      }
    }))
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
