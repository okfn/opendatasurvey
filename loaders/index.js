'use strict';

var _ = require('underscore');
var config = require('../config');
var models = require('../models');
var entitiesConstructor = require('./includes/entitiesConstructor');
var spreadSheetHandler = require('./includes/spreadSheetHandler');
var dbTransactions = require('./includes/dbTransactions');


var indexLoader = {
  /*
   * load Places from sheet to DB
   */
  loadPlaces: function (params) {
    var configUrl = params['configUrl'] || false;
    if (configUrl) {
      var placesUrlKey = spreadSheetHandler.getPlacesUrlKey(configUrl);
      var placesSpreadSheetUrl = spreadSheetHandler.getPlacesSpreadSheetUrl(placesUrlKey);
      return spreadSheetHandler.parse(placesSpreadSheetUrl)
        .spread(function (err, parsedPlaces) {
          if (err) {
            return [err, false];
          } else {
            var site = params['subDomain'];
            var mappedPlaces = false;
            parsedPlaces = entitiesConstructor.setSiteValue(parsedPlaces, site);
            mappedPlaces = entitiesConstructor.mapPlaces(parsedPlaces);
            return Promise.each(mappedPlaces, function (signleMappedPlace) {
              return dbTransactions.checkIfPlaceExist(signleMappedPlace['site'])
                .spread(function (err, isRecordExist, recordData) {
                  if (err) {
                    return [err, false];
                  } else {
                    return handleCheckIfExistResult(isRecordExist, recordData);
                  }
                });
            }).then(function () {
              return voidSavePlacesProcess(mappedPlaces);
            });
          }
        });
    } else {
      return new Promise(function (resolve, reject) {
        resolve(['reload failed', false]);
      });
    }
  },

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
   * load Questions from sheet to DB
   */
  loadQuestions: function (params) {
    var configUrl = params['configUrl'];
    var questionsUrlKey = spreadSheetHandler.getDatasetsUrlKey(configUrl);
    var questionsSpreadSheetUrl = spreadSheetHandler.getQuestionsSpreadSheetUrl(questionsUrlKey);

    return spreadSheetHandler.parse(questionsSpreadSheetUrl)
      .spread(function (err, parsedQuestions) {
        if (err) {
          return [err, false];
        } else {
          var site = params['subDomain'];
          var mappedQuestions = false;
          parsedQuestions = entitiesConstructor.setSiteValue(parsedQuestions, site);
          mappedQuestions = entitiesConstructor.mapQuestions(parsedQuestions);
          return Promise.each(mappedQuestions, function (signleMappedQuestion) {
            return dbTransactions.checkIfQuestionExist(signleMappedQuestion['site'])
              .spread(function (err, isRecordExist, recordData) {
                if (err) {
                  return [err, false];
                } else {
                  return handleCheckIfExistResult(isRecordExist, recordData);
                }
              });
          }).then(function () {
            return voidSaveQuestionsProcess(mappedQuestions);
          });
        }
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

//check if entity exists in database
function handleCheckIfExistResult(isRecordExist, recordData) {
  if (isRecordExist) {
    return dbTransactions.deleteRecord(recordData);
  } else {
    return [false, true];
  }
}

//process places creation
function voidSavePlacesProcess(object) {
  return dbTransactions.savePlaces(object)
    .spread(function (err, saveResult) {
      return handleSaveResult(err, saveResult);
    });
}

//process datasets creation
function voidSaveDatasetsProcess(object) {
  return dbTransactions.saveDatasets(object)
    .spread(function (err, saveResult) {
      return handleSaveResult(err, saveResult);
    });
}

//process questions creation
function voidSaveQuestionsProcess(object) {
  return dbTransactions.saveQuestions(object)
    .spread(function (err, saveResult) {
      return handleSaveResult(err, saveResult);
    });
}

//process registry creation
function voidSaveRegistryProcess(object) {
  return dbTransactions.saveRegistry(object)
    .spread(function (err, saveResult) {
      return handleSaveResult(err, saveResult);
    });
}

//process config creation
function voidSaveConfigProcess(object) {
  return dbTransactions.saveConfig(object)
    .spread(function (err, saveResult) {
      return handleSaveResult(err, saveResult);
    });
}

//handle results of save functionality
function handleSaveResult(err, saveResult) {
  var result = false;
  if (err) {
    result = [err, false];
  } else {
    result = [false, saveResult];
  }
  return result;
}

module.exports = indexLoader;
