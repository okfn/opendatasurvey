'use strict';

function promisedLoad(res, options) {
  return loaders.loadData(options)
    .then(function() { res.send({status: 'ok', message: 'ok'}); })
    .catch(function(E) { res.send({status: 'error', message: E}); });
}

var _ = require('underscore');
var loaders = require('../loaders');
var models = require('../models');

var loaderFactory = function(site_id, loader, response) {
  return loader(site_id).spread(function(error, data) {
    if (error) {
      response.send({'status': 'error', message: error});
    } else {
      response.send({'status': 'ok', message: 'ok'});
    }
  });
};

var dashboard = function (req, res) {
  res.render('dashboard.html');
};

var loadRegistry = function (req, res) {
  return loaderFactory(req.params.domain, loaders.loadRegistry, res);
};

// Config loader doesn't return .spread(), but Promise()
var loadConfig = function (req, res) {
  return loaders.loadConfig(req.params.domain)
    .then(function() { res.send({'status': 'ok', message: 'ok'}); })
    .catch(function(E) { res.send({'status': 'error', message: E}); });
};

var loadPlaces = function (req, res) { return promisedLoad(res, {
  Model: models.Place,
  setting: 'places',
  site: req.params.domain
}); };

var loadDatasets = function (req, res) { return promisedLoad(res, {
  mapper : function(D) { return _.extend(D, {name: D.title}) },
  Model  : models.Dataset,
  setting: 'datasets',
  site   : req.params.domain
}); };

var loadQuestions = function (req, res) { return promisedLoad(res, {
  mapper : function(D) { return _.extend(D, {dependants: D.dependants.split(','), score: D.score || 0}) },
  Model  : models.Question,
  setting: 'questions',
  site   : req.params.domain
}); };


module.exports = {
  dashboard: dashboard,
  loadRegistry: loadRegistry,
  loadConfig: loadConfig,
  loadPlaces: loadPlaces,
  loadDatasets: loadDatasets,
  loadQuestions: loadQuestions
}
