'use strict';

const execFile = require('child_process').execFile;

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

let buildIndexSite = function(req, res) {
  /*
  Generate and deploy an Index site for the site specified in the request.
  */

  // Set env for process to include DEBUG option, for more comprehensive
  // logging.
  const env = process.env;
  // env.DEBUG = 'metalsmith-godi-*';

  execFile('node', ['index/generate.js', res.locals.domain, '-dsy', res.locals.surveyYear],
    {env: env}, (error, stdout, stderr) => {
      if (error) {
        console.log(`${stderr}`);
        return res.send({status: 'error', message: `${stderr}`});
      }
      return res.send({status: 'ok', message: 'Index site built for ' + req.params.domain});
    });
};

module.exports = {
  dashboard: dashboard,
  loadConfig: loadConfig,
  loadPlaces: loadPlaces,
  loadDatasets: loadDatasets,
  loadQuestionSets: loadQuestionSets,
  buildIndexSite: buildIndexSite
};
