'use strict';

var express = require('express');
var census = require('../controllers/census');
var utils = require('./utils');

var censusRoutes = function(middlewares) {

  var router = express.Router();

  router.use(middlewares);

  router.get(utils.scoped('/submit'), census.submit);
  router.post(utils.scoped('/submit'), census.submit);
  router.get(utils.scoped('/submission/:submissionid'), census.submission);
  router.post(utils.scoped('/submission/:submissionid'), census.reviewPost);

  return router;

};


module.exports = censusRoutes;
