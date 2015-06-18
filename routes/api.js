'use strict';

var express = require('express');
var api = require('../controllers/api');
var mixins = require('../controllers/mixins');
var utils = require('./utils');


var apiRoutes = function(coreMiddlewares) {

  var router = express.Router();
  var coreMixins = [mixins.requireDomain];

  router.use(coreMiddlewares);

  router.get(utils.scoped('/api/entries.:format'), coreMixins, api.api);

  return router;

};


module.exports = apiRoutes;
