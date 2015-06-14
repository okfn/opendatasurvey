'use strict';

var express = require('express');


var i18nRoutes = function() {

  var router = express.Router();

  router.get('/:locale', function (req, res) {
    res.cookie('lang', req.params.locale);
    res.redirect(req.headers.referer || '/');
  });

  return router;
};


module.exports = i18nRoutes;
