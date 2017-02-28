'use strict';

var express = require('express');
var admin = require('../controllers/admin');
var mixins = require('../controllers/mixins');
var utils = require('./utils');

var adminRoutes = function(coreMiddlewares) {
  var router = express.Router();
  var coreMixins = [mixins.requireDomainAssets, mixins.requireAuth,
    mixins.requireAdmin];

  router.use(coreMiddlewares);

  router.get(utils.scoped('/'), coreMixins, admin.dashboard);
  router.post(utils.scoped('/load/places'), coreMixins, admin.loadPlaces);
  router.post(utils.scoped('/load/datasets'), coreMixins, admin.loadDatasets);
  router.post(utils.scoped('/load/questionsets'),
              coreMixins, admin.loadQuestionSets);
  router.post(utils.scoped('/load/config'), coreMixins, admin.loadConfig);
  router.post(utils.scoped('/buildindex'), coreMixins, admin.buildIndexSite);

  return router;
};

module.exports = adminRoutes;
