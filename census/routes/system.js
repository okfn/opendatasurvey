'use strict';

var system = require('../controllers/system');
var mixins = require('../controllers/mixins');
var utils = require('./utils');


var systemRoutes = function(router) {

  var coreMixins = [mixins.requireSystemDomain, mixins.requireDomain];

  router.get(utils.scoped('/control'), coreMixins, system.admin);
  router.get(utils.scoped('/load/registry'), coreMixins, system.loadRegistry);
  router.get(utils.scoped('/load/all'), coreMixins, system.loadAll);

  return router;

};


module.exports = systemRoutes;
