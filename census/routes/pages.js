'use strict';

var express = require('express');
var pages = require('../controllers/pages');
var mixins = require('../controllers/mixins');
var utils = require('./utils');
var authRoutes = require('./auth');
var systemRoutes = require('./system');
var redirectRoutes = require('./redirects');


var pageRoutes = function(coreMiddlewares) {

  var router = express.Router();
  var coreMixins = [mixins.requireDomain];
  var byYearMixins = coreMixins.concat(mixins.requireAvailableYear);

  router.use(coreMiddlewares);

  authRoutes(router);
  systemRoutes(router);

  router.get(utils.scoped('/about'), coreMixins, pages.about);
  router.get(utils.scoped('/faq'), coreMixins, pages.faq);
  router.get(utils.scoped('/contribute'), coreMixins, pages.contribute);
  router.get(utils.scoped('/overview.json'), coreMixins, pages.resultJson);
  router.get(utils.scoped('/changes/:year?'), byYearMixins, pages.changes);
  router.get(utils.scoped('/place/:place/:year?'), byYearMixins, pages.place);
  router.get(utils.scoped('/dataset/:dataset/:year?'), byYearMixins, pages.dataset);
  router.get(utils.scoped('/entry/:place/:dataset/:year?'), byYearMixins, pages.entry);
  router.get(utils.scoped('/year/:year'), byYearMixins, pages.overview);
  router.get(utils.scoped('/'), byYearMixins, pages.overview);

  redirectRoutes(router);

  return router;

};


module.exports = pageRoutes;
