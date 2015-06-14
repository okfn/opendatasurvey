'use strict';

var express = require('express');
var pages = require('../controllers/pages');


var pageRoutes = function() {

  var router = express.Router();

  router.get('/', pages.overview);
  router.get('/about', pages.about);
  router.get('/faq', pages.faq);
  router.get('/changes', pages.changes);
  router.get('/contribute', pages.contribute);
  router.get('/overview.json', pages.resultJson);
  router.get('/place/:place', pages.place);
  router.get('/dataset/:dataset', pages.dataset);
  router.get('/entry/:place/:dataset', pages.entries);

  return router;
};


module.exports = pageRoutes;
