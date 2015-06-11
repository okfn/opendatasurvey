'use strict';
var configActions = require('./includes/configActions');
var entitiesConstructor = require('./includes/entitiesConstructor');
var spreadSheetHandler = require('./includes/spreadSheetHandler');
var dbTransactions = require('./includes/dbTransactions');
var Promise = require('bluebird');

var REGISTRY_FULL_DATA = false;
var MAIN_CONFIG_FULL_DATA = false;

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
  /*
   * load Datasets from sheet to DB
   */
  loadDatasets: function (params) {
    var configUrl = params['configUrl'];
    var datasetsUrlKey = spreadSheetHandler.getDatasetsUrlKey(configUrl);
    var datasetsSpreadSheetUrl = spreadSheetHandler.getDatasetsSpreadSheetUrl(datasetsUrlKey);

    return spreadSheetHandler.parse(datasetsSpreadSheetUrl)
      .spread(function (err, parsedDatasets) {
        if (err) {
          return [err, false];
        } else {
          var site = params['subDomain'];
          var mappedDataset = false;
          parsedDatasets = entitiesConstructor.setSiteValue(parsedDatasets, site);
          mappedDataset = entitiesConstructor.mapDatasets(parsedDatasets);
          return Promise.each(mappedDataset, function (signleMappedDataset) {
            return dbTransactions.checkIfDatasetExist(signleMappedDataset['site'])
              .spread(function (err, isRecordExist, recordData) {
                if (err) {
                  return [err, false];
                } else {
                  return handleCheckIfExistResult(isRecordExist, recordData);
                }
              });
          }).then(function () {
            return voidSaveDatasetsProcess(mappedDataset);
          });
        }
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
   * load Registry from sheet to DB
   */
  loadRegistry: function (params) {
    var site = params['subDomain'];
    var registryUrl = configActions.getRegistryUrl();
    return spreadSheetHandler.parse(registryUrl)
      .spread(function (err, registryData) {
        if (err) {
          return [err, false];
        } else {
          var mappedRegistry = false;
          var requiredRegistry = pullRequiredRegistryFromArray(registryData, site);
          requiredRegistry = entitiesConstructor.setSiteValue(requiredRegistry, site);
          mappedRegistry = entitiesConstructor.mapRegistry(requiredRegistry);
          if (mappedRegistry) {
            return dbTransactions.checkIfRegistryExist(site)
              .spread(function (err, isRecordExist, recordData) {
                if (err) {
                  return [err, false];
                } else {
                  return handleCheckIfExistResult(isRecordExist, recordData);
                }
              }).then(function () {
              return voidSaveRegistryProcess(mappedRegistry);
            });
          } else {
            return ['could not reload registry', false];
          }
        }
      });
  },
  /*
   * load Config (Site) from sheet to DB
   */
  loadConfig: function (params) {
    var site = params['subDomain'];
    var configUrl = params['configUrl'];

    return spreadSheetHandler.parse(configUrl)
      .spread(function (err, configData) {
        if (err) {
          return [err, false];
        } else {
          var mappedConfig = false;
          var deparsedConfig = false;

          deparsedConfig = entitiesConstructor.deparseConfig(configData);
          deparsedConfig = entitiesConstructor.setConfigId(deparsedConfig, site);
          mappedConfig = entitiesConstructor.mapConfig(deparsedConfig);
          
          if (mappedConfig) {
            return dbTransactions.checkIfConfigExist(site)
              .spread(function (err, isRecordExist, recordData) {
                if (err) {
                  return [err, false];
                } else {
                  return handleCheckIfExistResult(isRecordExist, recordData);
                }
              }).then(function () {
              return voidSaveConfigProcess(mappedConfig);
            });
          } else {
            return ['could not reload config', false];
          }
        }
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

