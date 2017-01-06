'use strict';

var system = require('../controllers/system');
var mixins = require('../controllers/mixins');
var utils = require('./utils');

var systemRoutes = function(router) {
  var coreMixins = [mixins.requireSystemDomain, mixins.requireDomainAssets,
    mixins.requireAdmin];

  router.get(utils.scoped('/control'), coreMixins, system.admin);
  router.post(utils.scoped('/load/registry'), coreMixins, system.loadRegistry);
  router.post(utils.scoped('/load/configs'), coreMixins, system.loadAllConfigs);
  router.post(utils.scoped('/load/places'), coreMixins, system.loadAllPlaces);
  router.post(utils.scoped('/load/datasets'), coreMixins,
    system.loadAllDatasets);
  router.post(utils.scoped('/load/questionsets'), coreMixins,
    system.loadAllQuestionSets);

  return router;
};

module.exports = systemRoutes;
