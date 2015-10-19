'use strict';

var _ = require('lodash');
var loaders = require('../loaders');
var Promise = require('bluebird');
var modelUtils = require('../models').utils;
var utils = require('./utils');

var promisedLoad = function(req, res, options) {
  return loaders.loadTranslatedData(options, req.app.get('models'))
    .then(function() { res.send({status: 'ok', message: 'ok'}); })
    .catch(function(E) { res.send({status: 'error', message: E}); });
};

var dashboard = function(req, res) {
  var dataOptions = _.merge(modelUtils.getDataOptions(req), {
    with: {Entry: false}
  });
  modelUtils.getData(dataOptions)
    .then(function(data) {
      res.render('admin.html', data);
    })
    .catch(console.trace.bind(console));
};

var loadConfig = function(req, res) {
  return loaders.loadConfig(req.params.domain, req.app.get('models'))
    .then(function() { res.send({'status': 'ok', message: 'ok'}); })
    .catch(function(E) { res.send({'status': 'error', message: E}); });
};

var loadPlaces = function(req, res) {
  return promisedLoad(req, res, {
    mapper: utils.placeMapper,
    Model: req.app.get('models').Place,
    setting: 'places',
    site: req.params.domain
  });
};

var loadDatasets = function(req, res) {
  return promisedLoad(req, res, {
    mapper: utils.datasetMapper,
    Model: req.app.get('models').Dataset,
    setting: 'datasets',
    site: req.params.domain
  });
};

var loadQuestions = function(req, res) {
  return promisedLoad(req, res, {
    mapper: utils.questionMapper,
    Model: req.app.get('models').Question,
    setting: 'questions',
    site: req.params.domain
  });
};

module.exports = {
  dashboard: dashboard,
  loadConfig: loadConfig,
  loadPlaces: loadPlaces,
  loadDatasets: loadDatasets,
  loadQuestions: loadQuestions
};
