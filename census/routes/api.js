'use strict';

var express = require('express');
var api = require('../controllers/api');
var mixins = require('../controllers/mixins');
var utils = require('./utils');


var apiRoutes = function(coreMiddlewares) {

  var router = express.Router();
  var coreMixins = [mixins.requireDomain];

  router.use(coreMiddlewares);

  router.get(utils.scoped('/entries.:format'), coreMixins, api.entries);
  router.get(utils.scoped('/entries/:year.:format'), coreMixins, api.entries);
  router.get(utils.scoped('/datasets.:format'), coreMixins, api.datasets);
  router.get(utils.scoped('/places.:format'), coreMixins, api.places);

  return router;

};


module.exports = apiRoutes;
