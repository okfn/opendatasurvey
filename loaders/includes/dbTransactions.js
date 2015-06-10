/*
 * DB Transactions to save and retrieve data
 */

var model = require('../../lib/model').OpenDataCensus;
var models = require('../../models');

var dbTransactions = {
  savePlaces: function (places) {
    var params = {
      entity: models.Place,
      data: places
    };
    return saveBulkEntitiesToDb(params);
  },
  saveDatasets: function (datasets) {
    var params = {
      entity: models.Dataset,
      data: datasets
    };
    return saveBulkEntitiesToDb(params);
  },
  saveQuestions: function (questions) {
    var params = {
      entity: models.Question,
      data: questions
    };
    return saveBulkEntitiesToDb(params);
  },
  saveRegistry: function (registryObjects) {
    var params = {
      entity: models.Registry,
      data: registryObjects
    };
    return saveBulkEntitiesToDb(params);
  },
  saveConfig: function (configObject) {
    var params = {
      entity: models.Site,
      data: configObject
    };
    return saveSingleEntityToDb(params);
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
  },
  getAllConfigs: function () {
    return models.sequelize.sync().then(function () {
      return models.Site.findAll().then(function (config) {
        return [false, config];
      });
    });
  }

};

function saveBulkEntitiesToDb(params) {
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

function saveSingleEntityToDb(params) {
  var Entity = params['entity'];
  var data = params['data'];
  if (data) {
    return models.sequelize.sync().then(function () {
      return Entity.create(data);
    });
  } else {
    return ['no data received', false];
  }
}


module.exports = dbTransactions;

