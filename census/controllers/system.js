'use strict';

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


var loadAll = function (req, res) {

  req.app.get('models').Registry.findAll()
    .then(function(results) {

      Promise.each(results, function(result) {
        return loaders.loadConfig(result.id, req.app.get('models'))
          .then(function(r) {
            console.log(r);
          })
          .catch(function(error) {console.log(error);});
      }).then(function(result) {
        res.send({'status': 'ok', message: 'ok'});
      });

    }).catch(console.log.bind(console));

};


module.exports = {
  admin: admin,
  loadRegistry: loadRegistry,
  loadAll: loadAll
};
