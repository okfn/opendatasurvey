'use strict';

var loaders = require('../loaders');
var Promise = require('bluebird');
var utils = require('./utils');

var admin = function(req, res) {
  req.app.get('models').Registry.findAll()
  .then(result => {
    res.render('system.html', {registry: result});
  });
};

var loadRegistry = function(req, res) {
  return loaders.loadRegistry(req.app.get('models'))
  .then(() => {
    res.send({status: 'ok', message: 'ok'});
  }).catch(err => {
    res.send({status: 'error', message: err.message});
  });
};

var loadAllConfigs = function(req, res) {
  return req.app.get('models').Registry.findAll()
  .then(results => {
    return Promise.each(results, result => {
      return loaders.loadConfig(result.id, req.app.get('models'))
      .then(() => {
        console.log('config loaded for ' + result.id);
      })
      .catch(console.trace.bind(console));
    });
  })
  .then(() => {
    res.send({status: 'ok', message: 'ok'});
  })
  .catch(console.trace.bind(console));
};

var loadAllPlaces = function(req, res) {
  return req.app.get('models').Site.findAll()
  .then(results => {
    return Promise.each(results, result => {
      var options = {
        mapper: utils.placeMapper,
        Model: req.app.get('models').Place,
        setting: 'places',
        site: result.id
      };
      return loaders.loadTranslatedData(options, req.app.get('models'))
      .then(() => {
        console.log('places loaded for ' + result.id);
      })
      .catch(console.trace.bind(console));
    });
  })
  .then(() => {
    res.send({status: 'ok', message: 'ok'});
  })
  .catch(err => {
    res.send({status: 'error', message: err});
  });
};

var loadAllDatasets = function(req, res) {
  return req.app.get('models').Site.findAll()
  .then(results => {
    return Promise.each(results, result => {
      var options = {
        mapper: utils.datasetMapper,
        Model: req.app.get('models').Dataset,
        setting: 'datasets',
        site: result.id
      };
      return loaders.loadTranslatedData(options, req.app.get('models'))
      .then(() => {
        console.log('datasets loaded for ' + result.id);
      })
      .catch(console.trace.bind(console));
    });
  })
  .then(() => {
    res.send({status: 'ok', message: 'ok'});
  })
  .catch(err => {
    res.send({status: 'error', message: err});
  });
};

var loadAllQuestionSets = function(req, res) {
  res.send('To Do');
  // req.app.get('models').Site.findAll()
  //   .then(function(results) {
  //     Promise.each(results, function(result) {
  //       var options = {
  //         mapper: utils.questionMapper,
  //         Model: req.app.get('models').Question,
  //         setting: 'questions',
  //         site: result.id
  //       };
  //       return loaders.loadTranslatedData(options, req.app.get('models'))
  //         .then(function() {
  //           console.log('questions loaded for ' + result.id);
  //         })
  //         .catch(console.trace.bind(console));
  //     })
  //       .then(function() {
  //         res.send({
  //           status: 'ok',
  //           message: 'ok'
  //         });
  //       })
  //       .catch(function(E) {
  //         res.send({
  //           status: 'error',
  //           message: E
  //         });
  //       });
  //   });
};

module.exports = {
  admin: admin,
  loadRegistry: loadRegistry,
  loadAllConfigs: loadAllConfigs,
  loadAllPlaces: loadAllPlaces,
  loadAllDatasets: loadAllDatasets,
  loadAllQuestionSets: loadAllQuestionSets
};
