'use strict';

var loaders = require('../loaders');
var Promise = require('bluebird');
var utils = require('./utils');

var admin = function(req, res) {
  req.app.get('models').Registry.findAll()
    .then(function(result) {
      res.render('system.html', {registry: result});
    });
};

var loadRegistry = function(req, res) {
  return loaders.loadRegistry(req.app.get('models'))
    .spread(function(error, data) {
      if (error) {
        res.send({
          status: 'error',
          message: error
        });
      } else {
        res.send({
          status: 'ok',
          message: 'ok'
        });
      }
    });
};

var loadAllConfigs = function(req, res) {
  req.app.get('models').Registry.findAll()
    .then(function(results) {
      Promise.each(results, function(result) {
        return loaders.loadConfig(result.id, req.app.get('models'))
          .then(function() {
            console.log('config loaded for ' + result.id);
          })
          .catch(console.trace.bind(console));
      }).then(function() {
        res.send({
          status: 'ok',
          message: 'ok'
        });
      });
    }).catch(console.trace.bind(console));
};

var loadAllPlaces = function(req, res) {
  req.app.get('models').Site.findAll()
    .then(function(results) {
      Promise.each(results, function(result) {
        var options = {
          mapper: utils.placeMapper,
          Model: req.app.get('models').Place,
          setting: 'places',
          site: result.id
        };
        return loaders.loadTranslatedData(options, req.app.get('models'))
          .then(function() {
            console.log('places loaded for ' + result.id);
          })
          .catch(console.trace.bind(console));
      })
        .then(function() {
          res.send({
            status: 'ok',
            message: 'ok'
          });
        })
        .catch(function(E) {
          res.send({
            status: 'error',
            message: E
          });
        });
    });
};

var loadAllDatasets = function(req, res) {
  req.app.get('models').Site.findAll()
    .then(function(results) {
      Promise.each(results, function(result) {
        var options = {
          mapper: utils.datasetMapper,
          Model: req.app.get('models').Dataset,
          setting: 'datasets',
          site: result.id
        };
        return loaders.loadTranslatedData(options, req.app.get('models'))
          .then(function() {
            console.log('datasets loaded for ' + result.id);
          })
          .catch(console.trace.bind(console));
      })
        .then(function() {
          res.send({
            status: 'ok',
            message: 'ok'
          });
        })
        .catch(function(E) {
          res.send({
            status: 'error',
            message: E
          });
        });
    });
};

var loadAllQuestions = function(req, res) {
  req.app.get('models').Site.findAll()
    .then(function(results) {
      Promise.each(results, function(result) {
        var options = {
          mapper: utils.questionMapper,
          Model: req.app.get('models').Question,
          setting: 'questions',
          site: result.id
        };
        return loaders.loadTranslatedData(options, req.app.get('models'))
          .then(function() {
            console.log('questions loaded for ' + result.id);
          })
          .catch(console.trace.bind(console));
      })
        .then(function() {
          res.send({
            status: 'ok',
            message: 'ok'
          });
        })
        .catch(function(E) {
          res.send({
            status: 'error',
            message: E
          });
        });
    });
};

module.exports = {
  admin: admin,
  loadRegistry: loadRegistry,
  loadAllConfigs: loadAllConfigs,
  loadAllPlaces: loadAllPlaces,
  loadAllDatasets: loadAllDatasets,
  loadAllQuestions: loadAllQuestions
};
