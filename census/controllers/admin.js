'use strict';

var _ = require('lodash');
var loaders = require('../loaders');
var Promise = require('bluebird');
var _promisedLoad = loaders._Load;


var dashboard = function (req, res) {

  res.render('admin.html');

};


var loadConfig = function (req, res) {

  return loaders.loadConfig(req.params.domain, req.app.get('models'))
    .then(function() { res.send({'status': 'ok', message: 'ok'}); })
    .catch(function(E) { res.send({'status': 'error', message: E}); });

};


var loadPlaces = function (req, res) {

  return _promisedLoad(req, res, {
    mapper: function(D) {return _.extend(D, {id: D.id.toLowerCase()});},
    Model: req.app.get('models').Place,
    setting: 'places',
    site: req.params.domain
  });

};

var loadDatasets = function (req, res) {

  return _promisedLoad(req, res, {
    mapper: function(D) {return _.extend(D, {id: D.id.toLowerCase(), name: D.title});},
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
