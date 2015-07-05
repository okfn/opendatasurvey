'use strict';

var express = require('express');
var pages = require('../controllers/pages');
var mixins = require('../controllers/mixins');
var utils = require('./utils');


var pageRoutes = function(coreMiddlewares) {

  var router = express.Router();
  var coreMixins = [mixins.requireDomain];
  var byYearMixins = coreMixins.concat(mixins.requireAvailableYear);

  router.use(coreMiddlewares);

  router.get(utils.scoped('/about'), coreMixins, pages.about);
  router.get(utils.scoped('/faq'), coreMixins, pages.faq);
  router.get(utils.scoped('/changes'), coreMixins, pages.changes);
  router.get(utils.scoped('/contribute'), coreMixins, pages.contribute);
  router.get(utils.scoped('/overview.json'), coreMixins, pages.resultJson);
  router.get(utils.scoped('/place/:place/:year?'), byYearMixins, pages.place);
  router.get(utils.scoped('/dataset/:dataset/:year?'), byYearMixins, pages.dataset);
  router.get(utils.scoped('/entry/:place/:dataset/:year?'), byYearMixins, pages.entry);
  router.get(utils.scoped('/:year?'), byYearMixins, pages.overview);

  return router;

};


module.exports = pageRoutes;
