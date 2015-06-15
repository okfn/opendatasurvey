'use strict';

var express = require('express');
var utils = require('./utils');

var i18nRoutes = function(middlewares) {

  var router = express.Router();

  router.use(middlewares);

  router.get(utils.scoped('/:locale'), function (req, res) {
    res.cookie('lang', req.params.locale);
    res.redirect(req.headers.referer || '/');
  });

  return router;

};


module.exports = i18nRoutes;
