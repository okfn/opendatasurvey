'use strict';

var express = require('express');
var admin = require('../controllers/admin');


var adminRoutes = function() {

  var router = express.Router();

  router.get('/', admin.dashboard);
  router.get('/load/places', admin.loadPlaces);
  router.get('/load/datasets', admin.loadDatasets);
  router.get('/load/questions', admin.loadQuestions);
  router.get('/load/registry', admin.loadRegistry);
  router.get('/load/config', admin.loadConfig);

  return router;
};


module.exports = adminRoutes;
