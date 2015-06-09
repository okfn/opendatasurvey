var model = require('../../lib/model').OpenDataCensus;
var models = require('../../models');

var dbTransactions = {
    savePlaces: function (places) {
        var params = {
            entity: models.Place,
            data: places
        };
        return saveEntityToDb(params);
    },
    saveDatasets: function (datasets) {
        var params = {
            entity: models.Dataset,
            data: datasets
        };
        return saveEntityToDb(params);
    },
    saveQuestions: function (questions) {
        var params = {
            entity: models.Question,
            data: questions
        };
        return saveEntityToDb(params);
    },
    saveRegistry: function (registryObjects) {
        var params = {
            entity: models.Registry,
            data: registryObjects
        };
        return saveEntityToDb(params);
    },
    getAllPlaces: function () {
        return models.sequelize.sync().then(function () {
            models.Place.findAll().then(function (places) {
                return [false, places];
            });

        });
    },
    getAllDatasets: function () {
        return models.sequelize.sync().then(function () {
            models.Dataset.findAll().then(function (datasets) {
                return [false, datasets];
            });
        });
    },
    getAllQuestions: function () {
        return models.sequelize.sync().then(function () {
            models.Question.findAll().then(function (datasets) {
                return [false, datasets];
            });

        });
    },
    getAllRegistry: function () {
        return models.sequelize.sync().then(function () {
            return models.Registry.findAll().then(function (registry) {
                return [false, registry];
            });
        });
    }

};

function saveEntityToDb(params) {
    var Entity = params['entity'];
    var data = params['data'];
    if (data) {
        return models.sequelize.sync().then(function () {
            return Entity.bulkCreate(data);
        });
    } else {
        return ['no data received', false];
    }
}


module.exports = dbTransactions;

