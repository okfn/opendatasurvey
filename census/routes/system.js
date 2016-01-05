'use strict';

var system = require('../controllers/system');
var mixins = require('../controllers/mixins');
var utils = require('./utils');

var systemRoutes = function(router) {
  var coreMixins = [mixins.requireSystemDomain, mixins.requireDomain,
    mixins.requireAdmin];

  router.get(utils.scoped('/control'), coreMixins, system.admin);
  router.get(utils.scoped('/load/registry'), coreMixins, system.loadRegistry);
  router.get(utils.scoped('/load/configs'), coreMixins, system.loadAllConfigs);
  router.get(utils.scoped('/load/places'), coreMixins, system.loadAllPlaces);
  router.get(utils.scoped('/load/datasets'), coreMixins,
    system.loadAllDatasets);
  router.get(utils.scoped('/load/questions'), coreMixins,
    system.loadAllQuestions);

  return router;
};

module.exports = systemRoutes;
