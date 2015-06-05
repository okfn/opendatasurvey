'use strict';
var util = require('../lib/util');
var config = require('../lib/config');
var mainDataMapper = require('./dataMapper/main');
var model = require('../lib/model').OpenDataCensus;
var models = require('../models');


var indexLoader = {
    savePlacesToDb: function (cb) {
        var placesUrl = false;
        placesUrl = getPlacesConfigUrl();
        if (placesUrl) {
            try {
                parseSpreadSheet(placesUrl, function (err, parsedPlaces) {
                    if (err) {
                        cb(err, false);
                    } else {

                        var mappedPlaces = [];
                        mappedPlaces = mapPlaces(parsedPlaces);
                        if (mappedPlaces) {
                            models.sequelize.sync().then(function () {
                                models.Place.bulkCreate(mappedPlaces).then(function () {
                                    models.Place.findAll().then(function (places) {
                                        cb(false, places);
                                    });
                                });
                            });
                        } else {
                            cb('no data received', false);
                        }
                    }
                });
            } catch (e) {
                console.log('Loader Error: ', e);
            }
        }

    },
    saveDatasetsToDb: function (cb) {
        var dataSetsUrl = getDatasetsConfigUrl();
        console.log(dataSetsUrl);
    },
    saveQuestionsToDb: function(cb){
        var questionsUrl = getQuestionsConfigUrl();
        console.log(questionsUrl);
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

function getPlacesConfigUrl() {
    var configUrl = false;
    configUrl = config.get('places') || false;
    return configUrl;
}

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

function parseSpreadSheet(fileUrl, cb) {
    //wrapped the function in case some new actions
    util.getCsvData(fileUrl, function (err, result) {
        if (err) {
            cb(err, false);
        } else {
            cb(false, result);
        }
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
