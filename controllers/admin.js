'use strict';

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
    .then(function() {
      res.send({'status': 'ok', message: 'ok'});
    })

    .catch(function(E) {
      res.send({'status': 'error', message: E});
    });
};

var loadPlaces = function (req, res) {
  return loaderFactory(req.params.domain, loaders.loadPlaces, res);
};

var loadDatasets = function (req, res) {
  return loaders.loadData({
    mapper : function(D) { return _.extend(D, {name: D.title}) },
    Model  : models.Dataset,
    setting: 'datasets',
    site   : req.params.domain,

  })
    .then(function() { res.send({status: 'ok', message: 'ok'}); })
    .catch(function(E) { res.send({status: 'error', message: E}); });
};

var loadQuestions = function (req, res) {
  return loaderFactory(req.params.domain, loaders.loadQuestions, res);
};

module.exports = {
  dashboard: dashboard,
  loadRegistry: loadRegistry,
  loadConfig: loadConfig,
  loadPlaces: loadPlaces,
  loadDatasets: loadDatasets,
  loadQuestions: loadQuestions
}
