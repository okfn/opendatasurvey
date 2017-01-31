'use strict';

const _ = require('lodash');
const loaders = require('../loaders');
const modelUtils = require('../models').utils;
const utils = require('./utils');

let promisedLoad = function(req, res, options) {
  return loaders.loadTranslatedData(options, req.app.get('models'))
    .then(function() {
      res.send({status: 'ok', message: 'ok'});
    }).catch(function(err) {
      console.log(err.stack);
      res.send({status: 'error', message: err.message});
    });
};

let dashboard = function(req, res) {
  const dataOptions = _.merge(modelUtils.getDataOptions(req), {
    with: {Entry: false}
  });
  modelUtils.getData(dataOptions)
    .then(function(data) {
      res.render('admin.html', data);
    }).catch(console.trace.bind(console));
};

let loadConfig = function(req, res) {
  return loaders.loadConfig(req.params.domain, req.app.get('models'))
    .then(function() {
      res.send({status: 'ok', message: 'ok'});
    }).catch(function(err) {
      console.log(err.stack);
      res.send({status: 'error', message: err.message});
    });
};

let loadPlaces = function(req, res) {
  return promisedLoad(req, res, {
    mapper: utils.placeMapper,
    Model: req.app.get('models').Place,
    setting: 'places',
    site: req.params.domain
  });
};

let loadDatasets = function(req, res) {
  return promisedLoad(req, res, {
    mapper: utils.datasetMapper,
    Model: req.app.get('models').Dataset,
    setting: 'datasets',
    site: req.params.domain
  });
};

let loadQuestionSets = function(req, res) {
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
