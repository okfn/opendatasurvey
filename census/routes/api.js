'use strict';

var express = require('express');
var api = require('../controllers/api');
var mixins = require('../controllers/mixins');
var utils = require('./utils');

var apiRoutes = function(coreMiddlewares) {
  var router = express.Router();
  var coreMixins = [mixins.requireDomain, mixins.requireAvailableYear];

  router.use(coreMiddlewares);

  router.get(utils.scoped('/entries.:strategy.:format'), coreMixins,
    api.entries);
  router.get(utils.scoped('/entries.:format'), coreMixins, api.entries);
  router.get(utils.scoped('/entries/:year.:strategy.:format'), coreMixins,
    api.entries);
  router.get(utils.scoped('/entries/:year.:format'), coreMixins, api.entries);
  router.get(utils.scoped('/datasets.:format'), coreMixins, api.datasets);
  router.get(utils.scoped('/places.:format'), coreMixins, api.places);
  router.get(utils.scoped('/questions.:format'), coreMixins, api.questions);

  return router;
};

module.exports = apiRoutes;
