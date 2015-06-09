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
                            var site = getSiteValue(signleRegistryObject);
                            var mappedPlaces = false;

                            parsedPlaces = setSiteValue(parsedPlaces, site);
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
                    var configSheetInfo = util.parseSpreadsheetUrl(configUrl);
                    var datasetsUrlKey = configSheetInfo['key'];
                    var datasetsSpreadSheetUrl = getDatasetsSpreadSheetUrl(datasetsUrlKey);

                    return parseSpreadSheet(datasetsSpreadSheetUrl).spread(function (err, parsedDatasets) {
                        if (err) {
                            return [err, false];
                        } else {
                            var site = getSiteValue(signleRegistryObject);
                            var mappedDatasets = false;

                            parsedDatasets = setSiteValue(parsedDatasets, site);
                            mappedDatasets = mapDatasetsObject(parsedDatasets);

                            if (mappedDatasets) {
                                return models.sequelize.sync().then(function () {
                                    return models.Dataset.bulkCreate(mappedDatasets);
                                });
                            } else {
                                return ['no data received', false];
                            }
                        }
                    });
                }).then(function () {
                    return models.sequelize.sync().then(function () {
                        models.Dataset.findAll().then(function (datasets) {
                            return [false, datasets];
                        });

                    });
                });
            }
        });
    },
    saveQuestionsToDb: function () {
        return this.loadRegistryData().spread(function (err, loadResult) {
            if (err) {
                return [err, false];
            } else {
                var registryData = getRegistryFullData();
                return Promise.each(registryData, function (signleRegistryObject) {
                    var configUrl = signleRegistryObject['configurl'];
                    var configSheetInfo = util.parseSpreadsheetUrl(configUrl);
                    var questionsUrlKey = configSheetInfo['key'];
                    var questionsSpreadSheetUrl = getQuestionsSpreadSheetUrl(questionsUrlKey);

                    return parseSpreadSheet(questionsSpreadSheetUrl).spread(function (err, parsedQuestions) {
                        if (err) {
                            return [err, false];
                        } else {
                            var site = getSiteValue(signleRegistryObject);
                            var mappedQuestions = false;

                            parsedQuestions = setSiteValue(parsedQuestions, site);
                            mappedQuestions = mapQuestionsObject(parsedQuestions);

                            if (mappedQuestions) {
                                return models.sequelize.sync().then(function () {
                                    return models.Question.bulkCreate(mappedQuestions);
                                });
                            } else {
                                return ['no data received', false];
                            }
                        }
                    });
                }).then(function () {
                    return models.sequelize.sync().then(function () {
                        models.Question.findAll().then(function (datasets) {
                            return [false, datasets];
                        });

                    });
                });
            }
        });
    },
    saveRegistryToDb: function () {
        var registryUrl = getRegistryUrl();
    }
};

function setSiteValue(placesArray, site) {
    for (var i = 0; i < placesArray.length; i++) {
        placesArray[i]['site'] = site;
    }

    return placesArray;
}

function setRegistryFullData(data) {
    REGISTRY_FULL_DATA = data;
}

function getRegistryFullData() {
    return REGISTRY_FULL_DATA;
}

function getSiteValue(object) {
    var site = false;
    site = object['censusid'];
    return site;
}

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

function getDatasetsSpreadSheetUrl(urlKey) {
    var spreadSheetUrl = false;
    var spreadSheetIndex = false;

    spreadSheetIndex = getDatasetsSheetIndex();
    spreadSheetUrl = util.getSpreadSheetPage({
        index: spreadSheetIndex,
        key: urlKey
    });

    return spreadSheetUrl;
}

function getQuestionsSpreadSheetUrl(urlKey) {
    var spreadSheetUrl = false;
    var spreadSheetIndex = false;

    spreadSheetIndex = getQuestionsSheetIndex();
    spreadSheetUrl = util.getSpreadSheetPage({
        index: spreadSheetIndex,
        key: urlKey
    });

    return spreadSheetUrl;
}

function mapPlaces(places) {
    var mappedObject = [];
    if (places && places.length) {
        var length = places.length;
        for (var i = 0; i < length; i++) {
            var currentObject = places[i];
            var mappedCurrentObject = mainDataMapper.mapPlaceObject(currentObject);
            if (mappedCurrentObject) {
                mappedObject.push(mappedCurrentObject);
            }
        }

        return mappedObject;
    } else {
        return false;
    }
}

function mapDatasetsObject(datasets) {
    var mappedObject = [];
    if (datasets && datasets.length) {
        var length = datasets.length;
        for (var i = 0; i < length; i++) {
            var currentObject = datasets[i];
            var mappedCurrentObject = mainDataMapper.mapDatasetsObject(currentObject);
            if (mappedCurrentObject) {
                mappedObject.push(mappedCurrentObject);
            }
        }

        return mappedObject;
    } else {
        return false;
    }
}

function mapQuestionsObject(questions) {
    var mappedObject = [];
    if (questions && questions.length) {
        var length = questions.length;
        for (var i = 0; i < length; i++) {
            var currentObject = questions[i];
            var mappedCurrentObject = mainDataMapper.mapQuestionObject(currentObject);
            if (mappedCurrentObject) {
                mappedObject.push(mappedCurrentObject);
            }
        }

        return mappedObject;
    } else {
        return false;
    }
}

function getRegistryUrl() {
    var registryUrl = false;
    registryUrl = config.get('registryUrl') || false;
    return registryUrl;
}

//function getConfigUrlFromParsedCsv(singleDataObject) {
//    var configUrl = false;
//
//    return configUrl;
//}
//
//function getDatasetsConfigUrl() {
//    var configUrl = false;
//    configUrl = config.get('datasets') || false;
//    return configUrl;
//}
//
//function getQuestionsConfigUrl() {
//    var configUrl = false;
//    configUrl = config.get('questions') || false;
//    return configUrl;
//}

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
