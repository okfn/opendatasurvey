'use strict';

var express = require('express');
var pages = require('../controllers/pages');
var utils = require('./utils');

var pageRoutes = function(middlewares) {

  var router = express.Router();

  router.use(middlewares);

  router.get(utils.scoped('/'), pages.overview);
  router.get(utils.scoped('/about'), pages.about);
  router.get(utils.scoped('/faq'), pages.faq);
  router.get(utils.scoped('/changes'), pages.changes);
  router.get(utils.scoped('/contribute'), pages.contribute);
  router.get(utils.scoped('/overview.json'), pages.resultJson);
  router.get(utils.scoped('/place/:place'), pages.place);
  router.get(utils.scoped('/dataset/:dataset'), pages.dataset);
  router.get(utils.scoped('/entry/:place/:dataset'), pages.entries);

  return router;

};


module.exports = pageRoutes;
