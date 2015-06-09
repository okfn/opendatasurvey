var Promise         = require('bluebird');
var util            = require('../../lib/util');

var spreadSheetHandler = {
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
    getPlacesUrlKey: function (configUrl) {
        var urlKey = false;
        var configSheetInfo = false;

        configSheetInfo = util.parseSpreadsheetUrl(configUrl);
        urlKey = configSheetInfo['key'];
        return urlKey;
    },
    getDatasetsUrlKey: function (configUrl) {
        var urlKey = false;
        var configSheetInfo = false;

        configSheetInfo = util.parseSpreadsheetUrl(configUrl);
        urlKey = configSheetInfo['key'];
        return urlKey;
    },
    getQuestionsUrlKey: function (configUrl) {
        var urlKey = false;
        var configSheetInfo = false;

        configSheetInfo = util.parseSpreadsheetUrl(configUrl);
        urlKey = configSheetInfo['key'];
        return urlKey;
    }
};

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
