'use strict';

var loaders = require('../loaders');

var loaderFactory = function(site_id, loader, response) {
  return loader(site_id).spread(function(error, data) {
    if (error) {
      response.send({'status': 'error', message: error});
    }
    response.send({'status': 'ok', message: 'ok'});
  });
};

var dashboard = function (req, res) {
  res.render('dashboard.html');
};

var loadRegistry = function (req, res) {
  return loaderFactory(req.params.domain, loaders.loadRegistry, res);
};

var loadConfig = function (req, res) {
  return loaderFactory(req.params.domain, loaders.loadConfig, res);
};

var loadPlaces = function (req, res) {
  return loaderFactory(req.params.domain, loaders.loadPlaces, res);
};

var loadDatasets = function (req, res) {
  return loaderFactory(req.params.domain, loaders.loadDatasets, res);
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
