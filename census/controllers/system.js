'use strict';

var _ = require('lodash');
var loaders = require('../loaders');
var Promise = require('bluebird');


var admin = function (req, res) {

  res.render('system.html');

};


var loadRegistry = function (req, res) {

  return loaders.loadRegistry(req.app.get('models'))
    .spread(function(error, data) {
      if (error)
        res.send({'status': 'error', message: error});
      else
        res.send({'status': 'ok', message: 'ok'});
    });

};


var loadAllConfigs = function (req, res) {

  req.app.get('models').Registry.findAll()
    .then(function(results) {

      Promise.each(results, function(result) {
        return loaders.loadConfig(result.id, req.app.get('models'))
          .then(function(r) {
            console.log(r);
          })
          .catch(console.log.bind(console));
      }).then(function(result) {
        res.send({'status': 'ok', message: 'ok'});
      });

    }).catch(console.log.bind(console));

};


var loadAllPlaces = function (req, res) {

  req.app.get('models').Site.findAll()
    .then(function(results) {

      Promise.each(results, function(result) {

        var options = {
          mapper: function(D) {return _.extend(D, {id: D.id.toLowerCase()});},
          Model: req.app.get('models').Place,
          setting: 'places',
          site: result.id
        };

        return loaders.loadTranslatedData(options, req.app.get('models'))
          .then(function() {console.log('loaded');}).catch(console.log.bind(console));

      })
        .then(function() { res.send({status: 'ok', message: 'ok'}); })
        .catch(function(E) { res.send({status: 'error', message: E}); });
    });
};


var loadAllDatasets = function (req, res) {

  req.app.get('models').Site.findAll()
    .then(function(results) {

      Promise.each(results, function(result) {

        var options = {
          mapper: function(D) {return _.extend(D, {id: D.id.toLowerCase(), name: D.title, order: D.order || 100});},
          Model: req.app.get('models').Dataset,
          setting: 'datasets',
          site: result.id
        };

        return loaders.loadTranslatedData(options, req.app.get('models'))
          .then(function() {console.log('one loaded');});

      })
        .then(function() { res.send({status: 'ok', message: 'ok'}); })
        .catch(function(E) { res.send({status: 'error', message: E}); });
    });
};


var loadAllQuestions = function (req, res) {

  req.app.get('models').Site.findAll()
    .then(function(results) {

      Promise.each(results, function(result) {

        var options = {
          mapper: function(D) {
            var dependants = null;
            if(D.dependants){ dependants = D.dependants.split(',');}
            return _.extend(D, {id: D.id.toLowerCase(), dependants: dependants, score: D.score || 0, order: D.order || 100});
          },
          Model: req.app.get('models').Question,
          setting: 'questions',
          site: result.id
        };

        return loaders.loadTranslatedData(options, req.app.get('models'))
          .then(function() {console.log('one loaded');}).catch(console.log.bind(console));

      })
        .then(function() { res.send({status: 'ok', message: 'ok'}); })
        .catch(function(E) { res.send({status: 'error', message: E}); });
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
