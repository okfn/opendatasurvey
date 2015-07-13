'use strict';

var express = require('express');
var census = require('../controllers/census');
var mixins = require('../controllers/mixins');
var utils = require('./utils');


var censusRoutes = function(coreMiddlewares) {

  var router = express.Router();
  var coreMixins = [mixins.requireDomain];//[mixins.requireDomain, mixins.requireAuth];
  var reviewMixins = coreMixins.concat(mixins.requireReviewer);

  router.use(coreMiddlewares);

  router.get(utils.scoped('/submit'), coreMixins, census.submit);
  router.post(utils.scoped('/submit'), coreMixins, census.submit);
  router.get(utils.scoped('/submission/:id'), coreMixins, census.submission);
  router.post(utils.scoped('/submission/:id'), reviewMixins, census.reviewPost);

  return router;

};


module.exports = censusRoutes;
