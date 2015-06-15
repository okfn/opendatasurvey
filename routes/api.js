'use strict';

var express = require('express');
var api = require('../controllers/api');
var utils = require('./utils');

var apiRoutes = function(middlewares) {

  var router = express.Router();

  router.use(middlewares);

  router.get(utils.scoped('/api/entries.:format'), api.api);

  return router;

};


module.exports = apiRoutes;
