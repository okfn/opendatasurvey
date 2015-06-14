'use strict';

var express = require('express');
var census = require('../controllers/census');


var censusRoutes = function() {

  var router = express.Router();

  router.get('/submit', census.submit);
  router.post('/submit', census.submit);
  router.get('/submission/:submissionid', census.submission);
  router.post('/submission/:submissionid', census.reviewPost);

  return router;
};


module.exports = censusRoutes;
