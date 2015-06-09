'use strict';
var util = require('../lib/util');
var config = require('../lib/config');
var mainDataMapper = require('./dataMapper/main');
var model = require('../lib/model').OpenDataCensus;
var models = require('../models');
var Promise = require('bluebird');

var REGISTRY_FULL_DATA = false;

var indexLoader = {
    loadRegistryData: function () {
        var registryUrl = getRegistryUrl();

        try {
            return parseSpreadSheet(registryUrl).spread(function (err, parsedRegistry) {
                setRegistryFullData(parsedRegistry);
                return [false, true];
            });
        } catch (e) {
            return new Promise(function (resolve, reject) {
                resolve(['request failed', false]);
            });
        }
    },
    savePlacesToDb: function () {
        return this.loadRegistryData().spread(function (err, loadResult) {
            if (err) {
                return [err, false];
            } else {
                var registryData = getRegistryFullData();
                return Promise.each(registryData, function (signleRegistryObject) {
                    var configUrl = signleRegistryObject['configurl'];
                    var configSheetInfo = util.parseSpreadsheetUrl(configUrl);
                    var placesUrlKey = configSheetInfo['key'];
                    var placesSpreadSheetUrl = getPlacesSpreadSheetUrl(placesUrlKey);

                    return parseSpreadSheet(placesSpreadSheetUrl).spread(function (err, parsedPlaces) {
                        if (err) {
                            return [err, false];
                        } else {
                            var site = signleRegistryObject['censusid'];
                            var mappedPlaces = false;

                            parsedPlaces = setPlacesSite(parsedPlaces, site);
                            mappedPlaces = mapPlaces(parsedPlaces);
                            if (mappedPlaces) {
                                return models.sequelize.sync().then(function () {
                                    models.Place.bulkCreate(mappedPlaces);
                                });
                            } else {
                                return ['no data received', false];
                            }
                        }
                    });
                }).then(function () {
                    return models.sequelize.sync().then(function () {
                        models.Place.findAll().then(function (places) {
                            return [false, places];
                        });

                    });
                });
            }
        });
    },
    saveDatasetsToDb: function () {
        return this.loadRegistryData().spread(function (err, loadResult) {
            if (err) {
                return [err, false];
            } else {
                var registryData = getRegistryFullData();
                return Promise.each(registryData, function (signleRegistryObject) {
                    var configUrl = signleRegistryObject['configurl'];
                    parseSpreadSheet(configUrl).spread(function (err, parsedConfig) {
                        if (err) {
                            return [err, false];
                        } else {

                        }
                    });

                });

            }
        });
//        console.log('dataSetsUrl');
//        console.log(dataSetsUrl);
    },
    saveQuestionsToDb: function () {
        return this.loadRegistryData().spread(function (err, loadResult) {
            if (err) {
                return [err, false];
            } else {
                var registryData = getRegistryFullData();
                return Promise.each(registryData, function (signleRegistryObject) {
                    var configUrl = signleRegistryObject['configurl'];
                    parseSpreadSheet(configUrl).spread(function (err, parsedConfig) {
                        if (err) {
                            return [err, false];
                        } else {

                        }
                    });

                });

            }
        });
//        console.log('questionsUrl');
//        console.log(questionsUrl);
    },
    saveRegistryToDb: function (cb) {
        var registryUrl = getRegistryUrl();
    }
};


function setRegistryFullData(data) {
    REGISTRY_FULL_DATA = data;
}

function getRegistryFullData() {
    return REGISTRY_FULL_DATA;
}

function getPlacesSheetIndex() {
    var index = 1;
    return  index;
}


function setPlacesSite(placesArray, site) {
    for (var i = 0; i < placesArray.length; i++) {
        placesArray[i]['site'] = site;
    }

    return placesArray;
}

function getPlacesSpreadSheetUrl(urlKey) {
    var placesSpreadSheetUrl = false;
    var placesSheetIndex = false;

    placesSheetIndex = getPlacesSheetIndex();
    placesSpreadSheetUrl = util.getSpreadSheetPage({
        index: placesSheetIndex,
        key: urlKey
    });

    return placesSpreadSheetUrl;
}

function mapPlaces(places) {
    var mappedPlaces = [];
    if (places && places.length) {
        var placesLength = places.length;
        for (var i = 0; i < placesLength; i++) {
            var currentPlace = places[i];
            var mappedCurrentPlace = mainDataMapper.mapPlaceObject(currentPlace);
            mappedPlaces.push(mappedCurrentPlace);
        }

        return mappedPlaces;
    } else {
        return false;
    }

}

function getRegistryUrl() {
    var registryUrl = false;
    registryUrl = config.get('registryUrl') || false;
    return registryUrl;
}

function getConfigUrlFromParsedCsv(singleDataObject) {
    var configUrl = false;

    return configUrl;
}

//function getPlacesConfigUrl() {
//    var configUrl = false;
//    configUrl = config.get('places') || false;
//    return configUrl;
//}

function getDatasetsConfigUrl() {
    var configUrl = false;
    configUrl = config.get('datasets') || false;
    return configUrl;
}

function getQuestionsConfigUrl() {
    var configUrl = false;
    configUrl = config.get('questions') || false;
    return configUrl;
}

function parseSpreadSheet(fileUrl) {
    return new Promise(function (resolve, reject) {
        var formattedUrl = util.getCsvUrlForGoogleSheet(fileUrl);
        util.getCsvData(formattedUrl, function (err, result) {
            if (err) {
                resolve([err, false]);
            } else {
                resolve([false, result]);
            }
        });
    });
}

function insertDbRecord() {

}

//var getRegistry = function() {
//
//};
//
//var getConfig = function(site_id) {
//
//};
//
//var getPlaces = function(site_id) {
//
//};
//
//var getDatasets = function(site_id) {
//
//};
//
//var getQuestions = function(site_id) {
//
//};
//
//var _migrateDatabase = function() {
//
//};
//
//var _migrateUsers = function() {
//
//};


module.exports = indexLoader;
