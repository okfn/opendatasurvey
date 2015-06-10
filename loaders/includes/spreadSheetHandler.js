var Promise = require('bluebird');
var util = require('../../lib/util');

var spreadSheetHandler = {
  /*
   * Parse spreadsheet
   */
  parse: function (fileUrl) {
    return new Promise(function (resolve, reject) {
      var formattedUrl = util.parseSpreadsheetUrl(fileUrl);
      formattedUrl = util.getCsvUrlForGoogleSheet(fileUrl);
      util.getCsvData(formattedUrl, function (err, result) {
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
    placesSpreadSheetUrl = util.getSpreadSheetPage({
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
    spreadSheetUrl = util.getSpreadSheetPage({
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
    spreadSheetUrl = util.getSpreadSheetPage({
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

    configSheetInfo = util.parseSpreadsheetUrl(configUrl);
    urlKey = configSheetInfo['key'];
    return urlKey;
  },
  /*
   * get questions url key according to config url
   */
  getQuestionsUrlKey: function (configUrl) {
    var urlKey = false;
    var configSheetInfo = false;

    configSheetInfo = util.parseSpreadsheetUrl(configUrl);
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
