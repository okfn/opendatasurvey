'use strict';
var util = require('../lib/util');
var config = require('../lib/config');
var mainDataMapper = require('./dataMapper/main');
var model = require('../lib/model').OpenDataCensus;
var models = require('../models');
var Promise = require('bluebird');


var indexLoader = {
    savePlacesToDb: function () {
        var registryUrl = false;
        var registryUrl = getRegistryUrl();
        //var placesUrl = false;
        //placesUrl = getPlacesConfigUrl();
        if (registryUrl) {
            try {
                console.log('registryUrl');
                console.log(registryUrl);
                //process.exit();
                return parseSpreadSheet(registryUrl).spread(function(err, parsedRegistry){
                    console.log(parsedRegistry);
                });
                
                
//                return parseSpreadSheet(placesUrl).spread(function (err, parsedPlaces) {
//                    if (err) {
//                        return [err, false];
//                    } else {
//                        var mappedPlaces = [];
//                        mappedPlaces = mapPlaces(parsedPlaces);
//                        if (mappedPlaces) {
//                            models.sequelize.sync().then(function () {
//                                models.Place.bulkCreate(mappedPlaces).then(function () {
//                                    models.Place.findAll().then(function (places) {
//                                        return [false, places];
//                                    });
//                                });
//                            });
//                        } else {
//                            return ['no data received', false];
//                        }
//                    }
//                });
            } catch (e) {
                console.log('Loader Error: ', e);
                throw e;
            }
        } else {
            return new Promise(function (resolve, reject) {
                resolve(['no URL received', false]);
            });
        }

    },
    saveDatasetsToDb: function (cb) {
        var dataSetsUrl = getDatasetsConfigUrl();
//        console.log('dataSetsUrl');
//        console.log(dataSetsUrl);
    },
    saveQuestionsToDb: function (cb) {
        var questionsUrl = getQuestionsConfigUrl();
//        console.log('questionsUrl');
//        console.log(questionsUrl);
    },
    saveRegistryToDb: function (cb) {
        var registryUrl = getRegistryUrl();
    }
};



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
    console.log('parseSpreadSheet');
    console.log('PRSE URL', fileUrl);
    return new Promise(function (resolve, reject) {
        util.getCsvData(fileUrl, function (err, result) {
            if (err) {
                console.log('ERR');
                resolve([err, false]);
            } else {
                console.log('RESOLVE');
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
