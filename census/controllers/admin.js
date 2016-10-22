'use strict';

var _ = require('lodash');
var loaders = require('../loaders');
var modelUtils = require('../models').utils;
var utils = require('./utils');

var promisedLoad = function(req, res, options) {
  return loaders.loadTranslatedData(options, req.app.get('models'))
    .then(function() {
      res.send({status: 'ok', message: 'ok'});
    }).catch(function(err) {
      console.log(err.stack);
      res.send({status: 'error', message: err.message});
    });
};

var dashboard = function(req, res) {
  var dataOptions = _.merge(modelUtils.getDataOptions(req), {
    with: {Entry: false}
  });
  modelUtils.getData(dataOptions)
    .then(function(data) {
      res.render('admin.html', data);
    }).catch(console.trace.bind(console));
};

var loadConfig = function(req, res) {
  return loaders.loadConfig(req.params.domain, req.app.get('models'))
    .then(function() {
      res.send({status: 'ok', message: 'ok'});
    }).catch(function(err) {
      console.log(err.stack);
      res.send({status: 'error', message: err.message});
    });
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

var loadQuestionSets = function(req, res) {
  /*
  For each Dataset in the site, load the associated QuestionSet.
  */
  return loaders.loadQuestionSets(req.params.domain, req.app.get('models'))
    .then(function() {
      res.send({status: 'ok', message: 'ok'});
    }).catch(function(err) {
      console.log(err.stack);
      res.send({status: 'error', message: err.message});
    });
};

module.exports = {
  dashboard: dashboard,
  loadConfig: loadConfig,
  loadPlaces: loadPlaces,
  loadDatasets: loadDatasets,
  loadQuestionSets: loadQuestionSets
};
