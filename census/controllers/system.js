'use strict';

var Promise = require('bluebird');

var loaders = require('../loaders');
var utils = require('./utils');
const git = require('git-rev-sync');

var admin = function(req, res) {
  req.app.get('models').Registry.findAll()
  .then(result => {
    const data = {
      registry: result
    };
    try {
      data.gitRev = git.short();
      data.gitBranch = git.branch();
    } catch (err) {
      console.log(err.stack);
    }
    return data;
  })
  .then(data => {
    res.render('system.html', data);
  });
};

var loadRegistry = function(req, res) {
  return loaders.loadRegistry(req.app.get('models'))
  .then(() => {
    res.send({status: 'ok', message: 'ok'});
  }).catch(err => {
    console.log(err.stack);
    res.send({status: 'error', message: err.message});
  });
};

var loadAllConfigs = function(req, res) {
  return req.app.get('models').Registry.findAll()
  .then(results => {
    return Promise.each(results, result => {
      return loaders.loadConfig(result.id, req.app.get('models'))
      .then(() => {
        console.log('config loaded for ' + result.id);
      })
      .catch(console.trace.bind(console));
    });
  })
  .then(() => {
    res.send({status: 'ok', message: 'ok'});
  })
  .catch(console.trace.bind(console));
};

var loadAllPlaces = function(req, res) {
  return req.app.get('models').Site.findAll()
  .then(results => {
    return Promise.each(results, result => {
      var options = {
        mapper: utils.placeMapper,
        Model: req.app.get('models').Place,
        setting: 'places',
        site: result.id
      };
      return loaders.loadTranslatedData(options, req.app.get('models'))
      .then(() => {
        // console.log('places loaded for ' + result.id);
      })
      .catch(console.trace.bind(console));
    });
  })
  .then(() => {
    res.send({status: 'ok', message: 'ok'});
  })
  .catch(err => {
    res.send({status: 'error', message: err});
  });
};

var loadAllDatasets = function(req, res) {
  return req.app.get('models').Site.findAll()
  .then(results => {
    return Promise.each(results, result => {
      var options = {
        mapper: utils.datasetMapper,
        Model: req.app.get('models').Dataset,
        setting: 'datasets',
        site: result.id
      };
      return loaders.loadTranslatedData(options, req.app.get('models'))
      .then(() => {
        // console.log('datasets loaded for ' + result.id);
      })
      .catch(console.trace.bind(console));
    });
  })
  .then(() => {
    res.send({status: 'ok', message: 'ok'});
  })
  .catch(err => {
    res.send({status: 'error', message: err});
  });
};

var loadAllQuestionSets = function(req, res) {
  return req.app.get('models').Site.findAll()
  .then(results => {
    return Promise.each(results, result => {
      return loaders.loadQuestionSets(result.id, req.app.get('models'))
        .then(() => {
          // console.log('questionsets loaded for site: ' + result.id);
        }).catch(console.trace.bind(console));
    });
  })
  .then(() => {
    res.send({status: 'ok', message: 'ok'});
  })
  .catch(err => {
    res.send({status: 'error', message: err});
  });
};

module.exports = {
  admin: admin,
  loadRegistry: loadRegistry,
  loadAllConfigs: loadAllConfigs,
  loadAllPlaces: loadAllPlaces,
  loadAllDatasets: loadAllDatasets,
  loadAllQuestionSets: loadAllQuestionSets
};
