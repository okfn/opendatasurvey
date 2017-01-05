'use strict';

var express = require('express');
var mixins = require('../controllers/mixins');
var utils = require('./utils');

var i18nRoutes = function(coreMiddlewares) {
  var router = express.Router();
  var coreMixins = [mixins.requireDomainAssets];

  router.use(coreMiddlewares);

  router.get(utils.scoped('/:locale'), coreMixins, function(req, res) {
    req.session.lang = req.params.locale;
    req.setLocale(req.params.locale);
    res.redirect(req.headers.referer || '/');
  });

  return router;
};

module.exports = i18nRoutes;
