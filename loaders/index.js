'use strict';
var config = require('../lib/config');
var entitiesConstructor = require('./includes/entitiesConstructor');
var spreadSheetHandler = require('./includes/spreadSheetHandler');
var dbTransactions = require('./includes/dbTransactions');
var Promise = require('bluebird');

var REGISTRY_FULL_DATA = false;
var MAIN_CONFIG_FULL_DATA = false;

var indexLoader = {
  loadPlaces: function (params) {
    var configUrl = params['configUrl'];
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
  },
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
          mappedDataset = entitiesConstructor.mapPlaces(parsedDatasets);
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
  loadQuestions: function (params) {
    var configUrl = params['configUrl'];
    var questionsUrlKey = spreadSheetHandler.getDatasetsUrlKey(configUrl);
    var questionsSpreadSheetUrl = spreadSheetHandler.getDatasetsSpreadSheetUrl(questionsUrlKey);

    return spreadSheetHandler.parse(questionsSpreadSheetUrl)
      .spread(function (err, parsedQuestions) {
        if (err) {
          return [err, false];
        } else {
          var site = params['subDomain'];
          var mappedQuestions = false;
          parsedQuestions = entitiesConstructor.setSiteValue(parsedQuestions, site);
          mappedQuestions = entitiesConstructor.mapPlaces(parsedQuestions);
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
  loadConfig: function (siteId) {

  }
};

function handleCheckIfExistResult(isRecordExist, recordData) {
  if (isRecordExist) {
    return dbTransactions.deleteRecord(recordData);
  } else {
    return [false, true];
  }
}

function voidSavePlacesProcess(object) {
  return dbTransactions.savePlaces(object)
    .spread(function (err, saveResult) {
      return handleSaveResult(err, saveResult);
    });
}

function voidSaveDatasetsProcess(object) {
  return dbTransactions.saveDatasets(object)
    .spread(function (err, saveResult) {
      return handleSaveResult(err, saveResult);
    });
}

function voidSaveQuestionsProcess(object) {
  return dbTransactions.saveQuestions(object)
    .spread(function (err, saveResult) {
      return handleSaveResult(err, saveResult);
    });
}

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

