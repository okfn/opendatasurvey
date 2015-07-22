'use strict';

var _ = require('lodash');
var loaders = require('../loaders');
var Promise = require('bluebird');
var modelUtils = require('../models').utils;


var _promisedLoad = function(req, res, options) {

  return loaders.loadTranslatedData(options, req.app.get('models'))
    .then(function() { res.send({status: 'ok', message: 'ok'}); })
    .catch(function(E) { res.send({status: 'error', message: E}); });

};


var dashboard = function (req, res) {

  modelUtils.loadModels({

    places: req.app.get('models').Place.findAll(modelUtils.siteQuery(req)),
    datasets: req.app.get('models').Dataset.findAll(modelUtils.siteQuery(req)),
    questions: req.app.get('models').Question.findAll(modelUtils.siteQuery(req))

  }).then(function(D) {

    res.render('admin.html', {
      places: _.sortByOrder(D.places, 'id', 'asc'),
      datasets: _.sortByOrder(D.datasets, 'order', 'asc'),
      questions: _.sortByOrder(D.questions, 'order', 'asc')
    });

  }).catch(console.log.bind(console));

};


var loadConfig = function (req, res) {

  return loaders.loadConfig(req.params.domain, req.app.get('models'))
    .then(function() { res.send({'status': 'ok', message: 'ok'}); })
    .catch(function(E) { res.send({'status': 'error', message: E}); });

};


var loadPlaces = function (req, res) {

  return _promisedLoad(req, res, {
    mapper: function(D) {
      var reviewers = [];
      if (D.reviewers) {
        reviewers = _.each(D.reviewers.split(','), function(r) {r.trim();});
      }
      return _.extend(D, {id: D.id.toLowerCase(), reviewers: reviewers});},
    Model: req.app.get('models').Place,
    setting: 'places',
    site: req.params.domain
  });

};

var loadDatasets = function (req, res) {

  return _promisedLoad(req, res, {
    mapper: function(D) {
      var reviewers = [];
      if (D.reviewers) {
        reviewers = _.each(D.reviewers.split(','), function(r) {r.trim();});
      }
      return _.extend(D, {id: D.id.toLowerCase(), name: D.title, order: D.order || 100, reviewers: reviewers});},
    Model: req.app.get('models').Dataset,
    setting: 'datasets',
    site: req.params.domain
  });

};

var loadQuestions = function (req, res) {

  return _promisedLoad(req, res, {
    mapper: function(D) {
      var dependants = null;
      if(D.dependants){ dependants = D.dependants.split(',');}
      return _.extend(D, {id: D.id.toLowerCase(), dependants: dependants, score: D.score || 0, order: D.order || 100});
    },
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
