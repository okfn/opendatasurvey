'use strict';

var express = require('express');
var api = require('../controllers/api');


var apiRoutes = function() {

  var router = express.Router();

  router.get('/api/entries.:format', api.api);

  return router;
};


module.exports = apiRoutes;
