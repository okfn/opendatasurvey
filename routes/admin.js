'use strict';

var express = require('express');
var admin = require('../controllers/admin');
var utils = require('./utils');

var adminRoutes = function(middlewares) {

  var router = express.Router();

  router.use(middlewares);

  router.get(utils.scoped('/'), admin.dashboard);
  router.get(utils.scoped('/load/places'), admin.loadPlaces);
  router.get(utils.scoped('/load/datasets'), admin.loadDatasets);
  router.get(utils.scoped('/load/questions'), admin.loadQuestions);
  router.get(utils.scoped('/load/registry'), admin.loadRegistry);
  router.get(utils.scoped('/load/config'), admin.loadConfig);

  return router;

};


module.exports = adminRoutes;
