'use strict';

var Promise = require('bluebird');
var utils = require('../utils');


var spreadSheetHandler = {
  /*
   * Parse spreadsheet
   */
  parse: function (fileUrl) {
    return new Promise(function (resolve, reject) {
      var formattedUrl = utils.parseSpreadsheetUrl(fileUrl);
      formattedUrl = utils.getCsvUrlForGoogleSheet(fileUrl);
      utils.getCsvData(formattedUrl, function (err, result) {
        if (err) {
          resolve([err, false]);
        } else {
          resolve([false, result]);
        }
      });
    });
  },
  /*
   * get places url from main Doc according to url key
   */
  getPlacesSpreadSheetUrl: function (urlKey) {
    var placesSpreadSheetUrl = false;
    var placesSheetIndex = false;

    placesSheetIndex = getPlacesSheetIndex();
    placesSpreadSheetUrl = utils.getSpreadSheetPage({
      index: placesSheetIndex,
      key: urlKey
    });

    return placesSpreadSheetUrl;
  },
  /*
   * get datasets url from main Doc according to url key
   */
  getDatasetsSpreadSheetUrl: function (urlKey) {
    var spreadSheetUrl = false;
    var spreadSheetIndex = false;

    spreadSheetIndex = getDatasetsSheetIndex();
    spreadSheetUrl = utils.getSpreadSheetPage({
      index: spreadSheetIndex,
      key: urlKey
    });

    return spreadSheetUrl;
  },
  /*
   * get questions url from main Doc according to url key
   */
  getQuestionsSpreadSheetUrl: function (urlKey) {
    var spreadSheetUrl = false;
    var spreadSheetIndex = false;

    spreadSheetIndex = getQuestionsSheetIndex();
    spreadSheetUrl = utils.getSpreadSheetPage({
      index: spreadSheetIndex,
      key: urlKey
    });

    return spreadSheetUrl;
  },
  /*
   * get places url key according to config url
   */
  getPlacesUrlKey: function (configUrl) {
    var urlKey = false;
    var configSheetInfo = false;

    configSheetInfo = util.parseSpreadsheetUrl(configUrl);
    urlKey = configSheetInfo['key'];
    return urlKey;
  },
  /*
   * get datasets url key according to config url
   */
  getDatasetsUrlKey: function (configUrl) {
    var urlKey = false;
    var configSheetInfo = false;

    configSheetInfo = utils.parseSpreadsheetUrl(configUrl);
    urlKey = configSheetInfo['key'];
    return urlKey;
  },
  /*
   * get questions url key according to config url
   */
  getQuestionsUrlKey: function (configUrl) {
    var urlKey = false;
    var configSheetInfo = false;

    configSheetInfo = utils.parseSpreadsheetUrl(configUrl);
    urlKey = configSheetInfo['key'];
    return urlKey;
  }
};

/*
 * Get spread sheet tab index
 */
function getPlacesSheetIndex() {
  var index = 1;
  return  index;
}

function getDatasetsSheetIndex() {
  var index = 2;
  return  index;
}

function getQuestionsSheetIndex() {
  var index = 4;
  return  index;
}

module.exports = spreadSheetHandler;
